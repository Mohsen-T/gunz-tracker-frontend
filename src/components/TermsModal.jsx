import { useEffect, useRef } from 'react';
import { TOS_VERSION, TOS_SECTIONS } from '../utils/terms';

/**
 * Terms of Service modal — scrollable, dark-themed, matches the GRIDZILLA style.
 *
 * Usage:
 *   const [showTos, setShowTos] = useState(false);
 *   {showTos && <TermsModal onClose={() => setShowTos(false)} />}
 */
export default function TermsModal({ onClose, isMobile }) {
  const overlayRef = useRef(null);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 0 : 24,
      }}
    >
      <div style={{
        background: '#080f08', border: '1px solid #142014',
        borderRadius: isMobile ? 0 : 14,
        width: '100%', maxWidth: 720, maxHeight: isMobile ? '100vh' : '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #142014',
          background: 'linear-gradient(135deg, #0a180a, #060b06)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80', letterSpacing: 2 }}>
              TERMS OF SERVICE
            </div>
            <div style={{ fontSize: 9, color: '#556', marginTop: 2 }}>
              Version {TOS_VERSION} &middot; GRIDZILLA Marketplace
            </div>
          </div>
          <button onClick={onClose} title="Close (Esc)" style={{
            background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 8,
            color: '#778', width: 32, height: 32, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>x</button>
        </div>

        {/* Body — scrollable */}
        <div style={{
          flex: 1, overflow: 'auto', padding: isMobile ? '16px' : '20px 32px',
        }}>
          {/* Intro pill */}
          <div style={{
            background: '#0a180a', border: '1px solid #142014', borderRadius: 10,
            padding: '12px 16px', marginBottom: 24,
            fontSize: 11, color: '#aaa', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#4ADE80' }}>Welcome to Gridzilla.</strong>
            {' '}Please read these Terms of Service carefully before using the platform.
            By accessing or using the Platform, you agree to be bound by these Terms.
          </div>

          {TOS_SECTIONS.map((section, i) => (
            <Section key={i} {...section} />
          ))}

          {/* Footer note */}
          <div style={{
            marginTop: 24, padding: '14px 16px',
            background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 10,
            fontSize: 10, color: '#778', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#4ADE80' }}>Disclaimer:</strong>
            {' '}GRIDZILLA is a peer-to-peer marketplace interface. We do not custody assets
            and are not a party to any transaction. Use the platform at your own risk.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #142014',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#060b06',
        }}>
          <span style={{ fontSize: 9, color: '#445' }}>
            Last updated: v{TOS_VERSION}
          </span>
          <button onClick={onClose} style={{
            background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
            color: '#000', border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 12, fontWeight: 800,
            fontFamily: 'inherit', letterSpacing: 2, cursor: 'pointer',
          }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body, list, after, afterList }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color: '#4ADE80',
        letterSpacing: 1, marginBottom: 8,
      }}>
        {title}
      </div>
      {body?.map((p, i) => (
        <p key={i} style={{
          fontSize: 11, color: '#bbb', lineHeight: 1.7, margin: '0 0 8px 0',
        }}>{p}</p>
      ))}
      {list && list.length > 0 && (
        <ul style={{
          margin: '6px 0 8px 0', paddingLeft: 22, color: '#aaa',
          fontSize: 11, lineHeight: 1.7,
        }}>
          {list.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {after?.map((p, i) => (
        <p key={i} style={{
          fontSize: 11, color: '#bbb', lineHeight: 1.7, margin: '0 0 6px 0',
        }}>{p}</p>
      ))}
      {afterList && afterList.length > 0 && (
        <ul style={{
          margin: '6px 0 0 0', paddingLeft: 22, color: '#aaa',
          fontSize: 11, lineHeight: 1.7,
        }}>
          {afterList.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
