import { useState, useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return {
        bg: '#d4edda',
        border: '#28a745',
        text: '#155724',
        progress: '#28a745'
      };
      case 'error': return {
        bg: '#f8d7da',
        border: '#dc3545',
        text: '#721c24',
        progress: '#dc3545'
      };
      case 'warning': return {
        bg: '#fff3cd',
        border: '#ffc107',
        text: '#856404',
        progress: '#ffc107'
      };
      case 'info': return {
        bg: '#d1ecf1',
        border: '#17a2b8',
        text: '#0c5460',
        progress: '#17a2b8'
      };
      default: return {
        bg: '#d1ecf1',
        border: '#17a2b8',
        text: '#0c5460',
        progress: '#17a2b8'
      };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '350px',
        maxWidth: '500px',
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ fontSize: '24px', flexShrink: 0 }}>
            {getIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: colors.text
            }}>
              {title}
            </h4>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: colors.text,
              lineHeight: '1.4',
              opacity: 0.9
            }}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.text,
              opacity: 0.7,
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: colors.progress,
          animation: `toast-progress ${duration}ms linear`,
          transformOrigin: 'left'
        }}
      />
      
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}