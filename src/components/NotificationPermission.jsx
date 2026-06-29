import React from 'react';
import { BellOff } from 'lucide-react';

export default function NotificationPermission({ permissionStatus, requestPermission }) {
  if (permissionStatus === 'granted') return null;

  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px dashed var(--error)',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginTop: '12px'
    }}>
      <BellOff size={20} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
          Notifications are {permissionStatus === 'denied' ? 'Blocked' : 'Disabled'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {permissionStatus === 'denied' 
            ? 'Open your device/browser settings and allow notifications for Sacred Word to get daily reminders.'
            : 'Allow notifications to keep your reading streak alive with scheduled reminders.'}
        </p>
        {permissionStatus !== 'denied' && (
          <button
            onClick={requestPermission}
            style={{
              background: 'var(--error)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--error)'}
          >
            Enable Notifications
          </button>
        )}
      </div>
    </div>
  );
}
