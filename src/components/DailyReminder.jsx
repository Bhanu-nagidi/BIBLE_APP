import React from 'react';
import { Bell, BellOff, Info } from 'lucide-react';
import TimePicker from './TimePicker';
import NotificationPermission from './NotificationPermission';

export default function DailyReminder({ reminderOn, reminderTime, permissionStatus, toggleReminder, changeReminderTime, triggerTestNotification, isGuest }) {
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Header Toggle Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: reminderOn ? '1px solid var(--border-subtle)' : 'none',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: reminderOn ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: reminderOn ? 'var(--accent-gold)' : 'var(--text-muted)'
          }}>
            {reminderOn ? <Bell size={18} /> : <BellOff size={18} />}
          </div>
          <div>
            <p style={{ fontSize: '0.93rem', color: 'var(--text-primary)', fontWeight: 600 }}>Daily Bible Reminders</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isGuest 
                ? 'Create an account to save daily reminders' 
                : reminderOn 
                  ? 'Scheduled notifications are active' 
                  : 'Get notified daily to read and build your streak'}
            </p>
          </div>
        </div>

        {/* Custom switch */}
        <div 
          onClick={toggleReminder} 
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            flexShrink: 0,
            background: reminderOn ? 'var(--accent-gold)' : 'var(--border)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.25s'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: reminderOn ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
          }} />
        </div>
      </div>

      {/* 2. Interactive Time Settings (only shown if ON) */}
      {reminderOn && !isGuest && (
        <div style={{
          padding: '0 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          
          <TimePicker 
            initialTime={reminderTime} 
            onSaveTime={changeReminderTime} 
          />

          {/* Test & Debug Actions */}
          <div className="reminder-test-row" style={{
            background: 'rgba(var(--accent-rgb), 0.03)',
            borderRadius: '10px',
            border: '1.5px dashed var(--border-subtle)',
            marginTop: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Verify device alerts:
              </span>
            </div>
            <button
              type="button"
              onClick={triggerTestNotification}
              className="reminder-test-btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-gold)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--accent-gold)';
              }}
            >
              Send Test alert
            </button>
          </div>

          {/* Permission Warnings */}
          <NotificationPermission 
            permissionStatus={permissionStatus} 
            requestPermission={toggleReminder} 
          />
        </div>
      )}
    </div>
  );
}
