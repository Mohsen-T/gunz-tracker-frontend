import { useState, useEffect } from 'react';
import { RARITY_CONFIG, NODE_IMAGE_URL } from '../utils/constants';
import { formatNum, shortenAddr } from '../utils/format';
import { fetchWallet } from '../services/api';
import { getBalance } from '../services/marketplace';

/**
 * Right slide-in wallet panel (OpenSea-style).
 * Shows balance, tokens, collections, and action buttons.
 */
export default function WalletPanel({ wallet, onClose, isMobile, onNavigateProfile }) {
  const [tab, setTab] = useState('tokens');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!wallet?.address) return;
    fetchWallet(wallet.address)
      .then(data => {
        setWalletData(data);
        setNodes(data.nodes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    getBalance(wallet.address)
      .then(bal => setBalance(bal))
      .catch(() => setBalance(null));
  }, [wallet?.address]);

  const totalHP = walletData?.totalHashpower || 0;
  const totalHexes = walletData?.totalHexes || 0;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 180,
        background: 'rgba(0,0,0,0.5)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 181,
        width: isMobile ? '100%' : 380,
        background: '#080f08', borderLeft: '1px solid #142014',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #142014',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{shortenAddr(wallet?.address)}</span>
          </div>
          <button onClick={onClose} style={{
            background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 8,
            color: '#556', width: 32, height: 32, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>x</button>
        </div>

        {/* Balance */}
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #0d180d' }}>
          <div style={{ fontSize: 9, color: '#556', letterSpacing: 2, marginBottom: 4 }}>TOTAL BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#4ADE80', marginBottom: 4 }}>
            {balance != null ? `${balance.toFixed(2)} GUN` : '— GUN'}
          </div>
          <div style={{ fontSize: 10, color: '#445' }}>
            {balance != null ? 'GUNZ Network' : 'Fetching balance...'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          padding: '16px 20px', borderBottom: '1px solid #0d180d',
        }}>
          {[
            { label: 'Send', icon: '↑', color: '#60A5FA' },
            { label: 'Swap', icon: '⇄', color: '#C084FC' },
            { label: 'Deposit', icon: '↓', color: '#4ADE80' },
            { label: 'Buy', icon: '+', color: '#FBBF24' },
          ].map(a => (
            <button key={a.label} style={{
              background: '#0a140a', border: '1px solid #142014', borderRadius: 10,
              padding: '10px 4px', cursor: 'pointer', textAlign: 'center',
              fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color + '44'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#142014'}
            >
              <div style={{ fontSize: 18, color: a.color, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 9, color: '#778', letterSpacing: 1 }}>{a.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #142014' }}>
          {['tokens', 'collections'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #4ADE80' : '2px solid transparent',
              color: tab === t ? '#4ADE80' : '#556',
              padding: '10px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {tab === 'tokens' ? (
            <div>
              {/* GUN token */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                background: '#0a140a', borderRadius: 10, marginBottom: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#4ADE8018',
                  border: '1px solid #4ADE8033', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#4ADE80',
                }}>G</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>GUN</div>
                  <div style={{ fontSize: 9, color: '#556' }}>GUNZ Network</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>{balance != null ? balance.toFixed(2) : '—'}</div>
                  <div style={{ fontSize: 9, color: '#445' }}>GUN</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <div style={{ background: '#0a140a', borderRadius: 8, padding: '10px' }}>
                  <div style={{ fontSize: 8, color: '#445', letterSpacing: 1, marginBottom: 2 }}>NODES</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{nodes.length}</div>
                </div>
                <div style={{ background: '#0a140a', borderRadius: 8, padding: '10px' }}>
                  <div style={{ fontSize: 8, color: '#445', letterSpacing: 1, marginBottom: 2 }}>HASHPOWER</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FBBF24' }}>{formatNum(totalHP)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#445', fontSize: 11, animation: 'pulse 1.5s infinite' }}>
                  Loading collections...
                </div>
              ) : nodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#445', fontSize: 11 }}>
                  No NFTs in this wallet
                </div>
              ) : (
                <>
                  {/* Collection header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa' }}>Hacker Licenses</div>
                    <div style={{ fontSize: 10, color: '#556' }}>{nodes.length} items</div>
                  </div>

                  {/* NFT grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {nodes.slice(0, 30).map(node => {
                      const rc = RARITY_CONFIG[node.rarity]?.color || '#778';
                      return (
                        <div key={node.id} style={{
                          background: '#0a140a', borderRadius: 8, overflow: 'hidden',
                          border: '1px solid #142014', cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = rc + '44'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#142014'}
                        >
                          <div style={{ position: 'relative', paddingTop: '100%', background: '#060b06' }}>
                            <img src={NODE_IMAGE_URL(node.id)} alt={`#${node.id}`}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ padding: '4px 6px' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#ddd' }}>#{node.id}</div>
                            <div style={{ fontSize: 7, color: rc }}>{node.rarity}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {nodes.length > 30 && (
                    <button onClick={() => onNavigateProfile?.()} style={{
                      width: '100%', marginTop: 12, padding: '8px', background: '#0a140a',
                      border: '1px solid #1a2a1a', borderRadius: 8, color: '#4ADE80',
                      fontSize: 10, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                      letterSpacing: 1,
                    }}>VIEW ALL ({nodes.length})</button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
