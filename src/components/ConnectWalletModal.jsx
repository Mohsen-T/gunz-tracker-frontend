import { useState } from 'react';
import { shortenAddr } from '../utils/format';
import TermsModal from './TermsModal';

/**
 * OpenSea-style wallet connection flow:
 *   Step 1: Choose wallet provider
 *   Step 2: Welcome / TOS agreement
 *   Step 3: Signature request (waiting for wallet)
 *   Step 4: Done (auto-closes)
 */

const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'M',
    color: '#F6851B',
    desc: 'Connect with your MetaMask wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'W',
    color: '#3B99FC',
    desc: 'Scan with WalletConnect',
    disabled: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'C',
    color: '#0052FF',
    desc: 'Connect with Coinbase',
    disabled: true,
  },
];

export default function ConnectWalletModal({ onClose, onConnect, wallet, isMobile }) {
  const [step, setStep] = useState(1);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [sigPending, setSigPending] = useState(false);
  const [email, setEmail] = useState('');
  const [showTos, setShowTos] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const handleSelectProvider = async (providerId) => {
    if (providerId === 'metamask') {
      const addr = await wallet.connectMetaMask();
      if (addr) setStep(2);
    }
  };

  const handleAcceptTOS = async () => {
    setStep(3);
    setSigPending(true);
    const ok = await wallet.requestSignature();
    setSigPending(false);
    if (ok) {
      setStep(4);
      setTimeout(() => onConnect?.(), 800);
    } else {
      // Sig rejected — stay on step 3 to retry
    }
  };

  const handleRetrySig = async () => {
    setSigPending(true);
    const ok = await wallet.requestSignature();
    setSigPending(false);
    if (ok) {
      setStep(4);
      setTimeout(() => onConnect?.(), 800);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center',
    }}>
      <div style={{
        background: '#080f08', border: '1px solid #142014',
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        width: isMobile ? '100%' : 420,
        maxHeight: isMobile ? '85vh' : '75vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #142014',
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#e0e0e0', letterSpacing: 1 }}>
            {step === 1 ? 'Connect Wallet' : step === 2 ? 'Welcome to GRIDZILLA' : step === 3 ? 'Verify Wallet' : 'Connected!'}
          </span>
          <button onClick={onClose} style={{
            background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 8,
            color: '#556', width: 32, height: 32, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>x</button>
        </div>

        <div style={{ padding: '16px 20px' }}>

          {/* ── Step 1: Choose Wallet ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 16, lineHeight: 1.5 }}>
                Connect your wallet to buy, sell, and manage your GUNZ Hacker License NFTs.
              </div>

              {/* Wallet options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {WALLET_OPTIONS.map(w => (
                  <button
                    key={w.id}
                    onClick={() => !w.disabled && handleSelectProvider(w.id)}
                    disabled={w.disabled || wallet.connecting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: '#0a140a',
                      border: '1px solid #1a2a1a', borderRadius: 10,
                      cursor: w.disabled ? 'default' : 'pointer',
                      opacity: w.disabled ? 0.35 : 1,
                      transition: 'all 0.15s', textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!w.disabled) { e.currentTarget.style.borderColor = w.color + '55'; e.currentTarget.style.background = '#0c180c'; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2a1a'; e.currentTarget.style.background = '#0a140a'; }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: w.color + '18', border: `1px solid ${w.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: w.color,
                    }}>
                      {w.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ddd', marginBottom: 2 }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: '#556' }}>{w.disabled ? 'Coming soon' : w.desc}</div>
                    </div>
                    {!w.disabled && (
                      <div style={{ fontSize: 10, color: '#4ADE8066' }}>&#8594;</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: '#1a2a1a' }} />
                <span style={{ fontSize: 9, color: '#445', letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#1a2a1a' }} />
              </div>

              {/* Email option */}
              {!showEmail ? (
                <button
                  onClick={() => setShowEmail(true)}
                  style={{
                    width: '100%', padding: '12px', background: '#0a140a',
                    border: '1px solid #1a2a1a', borderRadius: 10, cursor: 'pointer',
                    fontSize: 12, color: '#778', fontFamily: 'inherit', fontWeight: 600,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a3a2a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2a1a'}
                >
                  Continue with email
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email" placeholder="Enter email address"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{
                      flex: 1, background: '#060b06', border: '1px solid #1a2a1a',
                      borderRadius: 8, color: '#ddd', padding: '10px 12px',
                      fontSize: 12, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button style={{
                    background: '#4ADE8022', border: '1px solid #4ADE8044',
                    borderRadius: 8, color: '#4ADE80', padding: '10px 16px',
                    fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                    cursor: 'pointer', letterSpacing: 1, opacity: 0.4,
                  }} disabled>SOON</button>
                </div>
              )}

              {wallet.error && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 10, color: '#EF4444' }}>
                  {wallet.error}
                </div>
              )}

              {wallet.connecting && (
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#4ADE80', animation: 'pulse 1.5s infinite' }}>
                  Connecting to wallet...
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Welcome / TOS ── */}
          {step === 2 && wallet.address && (
            <div>
              {/* Logo / welcome graphic */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img src="/logo.png" alt="GRIDZILLA" style={{ height: 50, marginBottom: 12, opacity: 0.8 }} />
                <div style={{ fontSize: 11, color: '#778', marginBottom: 4 }}>Connected as</div>
                <div style={{
                  display: 'inline-block', background: '#0a180a', border: '1px solid #142014',
                  borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#4ADE80',
                }}>
                  {shortenAddr(wallet.address)}
                </div>
              </div>

              <div style={{
                background: '#0a140a', border: '1px solid #0d180d', borderRadius: 10,
                padding: 16, marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.7, marginBottom: 12 }}>
                  By connecting your wallet and using GRIDZILLA Marketplace, you agree to our:
                </div>

                {/* TOS checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                  <input
                    type="checkbox" checked={tosAgreed}
                    onChange={e => setTosAgreed(e.target.checked)}
                    style={{ marginTop: 3, accentColor: '#4ADE80' }}
                  />
                  <span style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                    I agree to the <span onClick={(e) => { e.preventDefault(); setShowTos(true); }} style={{ color: '#4ADE80', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and{' '}
                    <span style={{ color: '#4ADE80', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
                  </span>
                </label>
              </div>

              <div style={{ fontSize: 9, color: '#445', marginBottom: 16, lineHeight: 1.6 }}>
                In the next step, you'll be asked to sign a message in your wallet.
                This is a free, gasless signature to verify you own this wallet. It does not grant access to your funds.
              </div>

              <button
                onClick={handleAcceptTOS}
                disabled={!tosAgreed}
                style={{
                  width: '100%',
                  background: tosAgreed ? 'linear-gradient(135deg, #4ADE80, #22c55e)' : '#0a140a',
                  color: tosAgreed ? '#000' : '#334',
                  border: 'none', borderRadius: 10, padding: '12px',
                  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  cursor: tosAgreed ? 'pointer' : 'default', letterSpacing: 2,
                  transition: 'all 0.2s',
                }}
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* ── Step 3: Signature Request ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {sigPending ? (
                <>
                  {/* Waiting animation */}
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: '3px solid #142014', borderTopColor: '#4ADE80',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ddd', marginBottom: 8 }}>
                    Waiting for signature...
                  </div>
                  <div style={{ fontSize: 11, color: '#556', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                    Please confirm the signature request in your wallet.
                    This verifies you own this wallet and is completely free.
                  </div>
                </>
              ) : (
                <>
                  {/* Sig rejected — retry */}
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: '#1a0a0a', border: '2px solid #EF444444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: 28, color: '#EF4444',
                  }}>!</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>
                    {wallet.error || 'Signature not confirmed'}
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 20 }}>
                    The signature request was rejected or timed out.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setStep(1)} style={{
                      flex: 1, background: 'transparent', border: '1px solid #1a2a1a',
                      borderRadius: 8, color: '#778', padding: '10px', fontSize: 11,
                      fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                    }}>BACK</button>
                    <button onClick={handleRetrySig} style={{
                      flex: 1, background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
                      color: '#000', border: 'none', borderRadius: 8, padding: '10px',
                      fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                    }}>TRY AGAIN</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#0a180a', border: '2px solid #4ADE8066',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28, color: '#4ADE80',
              }}>&#10003;</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80', marginBottom: 8, letterSpacing: 1 }}>
                Wallet Connected
              </div>
              <div style={{ fontSize: 11, color: '#556' }}>
                {shortenAddr(wallet.address)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms of Service modal — opened from the TOS link in step 2 */}
      {showTos && <TermsModal onClose={() => setShowTos(false)} isMobile={isMobile} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
