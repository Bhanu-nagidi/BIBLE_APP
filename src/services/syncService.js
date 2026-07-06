import { supabase } from '../lib/supabase'

export const syncService = {
  // Debounce timers to prevent excessive DB writes
  _debounceTimers: {},

  // Pulls all data from Supabase for a given user and overwrites local storage
  async pull(userId) {
    if (!supabase) return null;
    try {
      console.log(`[syncService] Pulling user records for user: ${userId}`);
      const { data, error } = await supabase
        .from('user_records')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[syncService] Pull failed. If you have not created the user_records table in your Supabase dashboard yet, please run the SQL setup script in your Supabase SQL Editor. Error:', error.message);
        return null;
      }

      if (data?.data) {
        const remoteData = data.data;
        console.log('[syncService] Successfully retrieved remote records:', remoteData);
        
        // Save to local storage with user sandboxed keys
        if (remoteData.bookmarks) {
          localStorage.setItem(`bible_bookmarks_${userId}`, JSON.stringify(remoteData.bookmarks));
        }
        if (remoteData.notes) {
          localStorage.setItem(`bible_notes_${userId}`, JSON.stringify(remoteData.notes));
        }
        if (remoteData.streak) {
          localStorage.setItem(`bible_streak_${userId}`, JSON.stringify(remoteData.streak));
        }
        if (remoteData.activePlan) {
          localStorage.setItem(`bible_active_plan_${userId}`, JSON.stringify(remoteData.activePlan));
        }
        if (remoteData.reminders) {
          if (remoteData.reminders.on !== undefined) {
            localStorage.setItem(`reminder_on_${userId}`, String(remoteData.reminders.on));
          }
          if (remoteData.reminders.time) {
            localStorage.setItem(`reminder_time_${userId}`, remoteData.reminders.time);
          }
        }
        if (remoteData.settings) {
          const s = remoteData.settings;
          if (s.theme) {
            localStorage.setItem('app_theme', s.theme);
            if (s.theme === 'light') {
              document.documentElement.removeAttribute('data-theme');
            } else {
              document.documentElement.setAttribute('data-theme', s.theme);
            }
          }
          if (s.fontStyle) {
            localStorage.setItem('font_style', s.fontStyle);
            document.documentElement.style.setProperty('--reader-font',
              s.fontStyle === 'serif' ? "'Crimson Pro', serif" : "'Inter', sans-serif");
          }
          if (s.lineSpacing) {
            localStorage.setItem('line_spacing', s.lineSpacing);
          }
          if (s.dailyVerse !== undefined) {
            localStorage.setItem('daily_verse', String(s.dailyVerse));
          }
          if (s.language) {
            localStorage.setItem('bible_language', JSON.stringify(s.language));
          }
          if (s.fontSize) {
            localStorage.setItem('bible_fontsize', String(s.fontSize));
          }
        }
        return remoteData;
      } else {
        console.log('[syncService] No remote record found. Performing initial database backup of current local data.');
        await this.push(userId);
      }
    } catch (e) {
      console.warn('[syncService] Exception in pull:', e);
    }
    return null;
  },

  // Gathers local storage data and pushes to Supabase (creates or updates the user profile record)
  async push(userId) {
    if (!supabase) return;
    try {
      const bookmarks = JSON.parse(localStorage.getItem(`bible_bookmarks_${userId}`) || '[]');
      const notes = JSON.parse(localStorage.getItem(`bible_notes_${userId}`) || '[]');
      const streak = JSON.parse(localStorage.getItem(`bible_streak_${userId}`) || '{}');
      const activePlan = JSON.parse(localStorage.getItem(`bible_active_plan_${userId}`) || 'null');
      
      const reminderOn = localStorage.getItem(`reminder_on_${userId}`) === 'true';
      const reminderTime = localStorage.getItem(`reminder_time_${userId}`) || '08:00';
      
      const theme = localStorage.getItem('app_theme') || 'light';
      const fontStyle = localStorage.getItem('font_style') || 'sans';
      const lineSpacing = localStorage.getItem('line_spacing') || 'normal';
      const dailyVerse = localStorage.getItem('daily_verse') !== 'false';
      
      const savedLang = localStorage.getItem('bible_language');
      const language = savedLang ? JSON.parse(savedLang) : null;
      const fontSize = parseInt(localStorage.getItem('bible_fontsize') || '18');

      const payload = {
        bookmarks,
        notes,
        streak,
        activePlan,
        reminders: {
          on: reminderOn,
          time: reminderTime
        },
        settings: {
          theme,
          fontStyle,
          lineSpacing,
          dailyVerse,
          language,
          fontSize
        }
      };

      console.log('[syncService] Pushing full local state to remote DB...');
      const { error } = await supabase
        .from('user_records')
        .upsert({
          user_id: userId,
          data: payload,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('[syncService] Push failed. Make sure user_records table is created. Error:', error.message);
      } else {
        console.log('[syncService] Push succeeded.');
      }
    } catch (e) {
      console.warn('[syncService] Exception in push:', e);
    }
  },

  // Updates a single key in user_records data column incrementally
  async update(userId, key, value) {
    if (!supabase) return;
    try {
      const { data, error: selectError } = await supabase
        .from('user_records')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) {
        console.warn(`[syncService] Update select failed for key ${key}:`, selectError.message);
        return;
      }

      const currentData = data?.data || {};
      currentData[key] = value;

      const { error: upsertError } = await supabase
        .from('user_records')
        .upsert({
          user_id: userId,
          data: currentData,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.warn(`[syncService] Update upsert failed for key ${key}:`, upsertError.message);
      }
    } catch (e) {
      console.warn('[syncService] Exception in update:', e);
    }
  },

  // Debounced update helper to avoid excessive network requests (especially on timers or typing notes)
  updateDebounced(userId, key, value, delay = 2000) {
    const timerKey = `${userId}_${key}`;
    if (this._debounceTimers[timerKey]) {
      clearTimeout(this._debounceTimers[timerKey]);
    }
    this._debounceTimers[timerKey] = setTimeout(() => {
      delete this._debounceTimers[timerKey];
      this.update(userId, key, value);
    }, delay);
  }
}
