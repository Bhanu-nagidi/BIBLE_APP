import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { parseTimeTo12HourComponents, convertTo24HourTime, formatTo12Hour } from '../utils/reminderScheduler';
import { Clock, Edit2 } from 'lucide-react';

export default function TimePicker({ initialTime, onSaveTime }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localHour, setLocalHour] = useState('08');
  const [localMinute, setLocalMinute] = useState('00');
  const [localPeriod, setLocalPeriod] = useState('AM');
  const [isModified, setIsModified] = useState(false);

  // Initialize local states whenever the modal is opened
  useEffect(() => {
    if (isOpen && initialTime) {
      const { hour, minute, period } = parseTimeTo12HourComponents(initialTime);
      setLocalHour(hour);
      setLocalMinute(minute);
      setLocalPeriod(period);
      setIsModified(false); // Reset modification flag on open
    }
  }, [isOpen, initialTime]);

  const handleHourChange = (e) => {
    setLocalHour(e.target.value);
    setIsModified(true);
  };

  const handleMinuteChange = (e) => {
    setLocalMinute(e.target.value);
    setIsModified(true);
  };

  const handlePeriodChange = (p) => {
    setLocalPeriod(p);
    setIsModified(true);
  };

  const handleSave = () => {
    const newTime = convertTo24HourTime(localHour, localMinute, localPeriod);
    onSaveTime(newTime);
    setIsModified(false);
    setIsOpen(false); // Close popup on save
  };

  return (
    <>
      {/* 1. Main Trigger Card Row - Always Stable Size */}
      <div 
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} style={{ color: 'var(--accent-gold)' }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Reminder Time:</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatTo12Hour(initialTime)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.78rem',
          color: 'var(--accent-gold)',
          fontWeight: 600
        }}>
          <Edit2 size={13} />
          Change
        </div>
      </div>

      {/* 2. Fixed Position Popup Modal Overlay via Portal to escape parent overflow:hidden */}
      {isOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999, // Render over everything
        }}>
          {/* Modal Container */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '340px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2), var(--shadow-gold)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Set Reminder Time
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Select the time to get notified daily
              </p>
            </div>

            {/* Time Select Selectors */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              padding: '10px 0'
            }}>
              {/* Hour Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={localHour}
                  onChange={handleHourChange}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--accent-gold)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    padding: '10px 8px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '55px',
                    textAlign: 'center',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>H</span>
              </div>

              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '1.2rem' }}>:</span>

              {/* Minute Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={localMinute}
                  onChange={handleMinuteChange}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--accent-gold)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    padding: '10px 8px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '55px',
                    textAlign: 'center',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>M</span>
              </div>

              {/* AM / PM Toggle switch */}
              <div style={{ 
                display: 'flex', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '2px',
                marginLeft: '4px'
              }}>
                {['AM', 'PM'].map(p => {
                  const isActive = localPeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePeriodChange(p)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: isActive ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        border: 'none',
                        outline: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={!isModified}
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: isModified 
                    ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))' 
                    : 'var(--bg-secondary)',
                  border: isModified ? 'none' : '1px solid var(--border)',
                  color: isModified ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  cursor: isModified ? 'pointer' : 'not-allowed',
                  outline: 'none',
                  boxShadow: isModified ? 'var(--shadow)' : 'none',
                  opacity: isModified ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                Save Time
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
