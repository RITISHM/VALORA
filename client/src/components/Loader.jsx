/**
 * @file Loader.jsx
 * @description Reusable full-page loading state component for Valora ERP.
 */
import { Loader2 } from 'lucide-react';

/**
 * Centered loading spinner with optional message.
 * @param {string} message - Custom loading message (default: "Loading...")
 */
export default function Loader({ message = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 40px',
      gap: '16px',
      color: '#64748B',
    }}>
      <Loader2
        size={36}
        style={{
          color: '#714B67',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{
        fontSize: '0.95rem',
        fontWeight: 500,
        margin: 0,
        color: '#64748B',
      }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
