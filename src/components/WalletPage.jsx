import { useState, useEffect, useRef } from 'react';
import { RARITY_CONFIG, STATUS_CONFIG, NODE_IMAGE_URL, GUNZSCAN_NODE_URL } from '../utils/constants';
import { shortenAddr } from '../utils/format';
import { fetchWallet } from '../services/api';
import { useIsMobile } from '../hooks/useIsMobile';

const BATCH_SIZE = 30;

function NodeImage({ id, rarity, color, height = 140 }) {
  const [status, setStatus] = useState('loading');
  return (
    <div style={{
      width: '100%', height, background: '#0a120a',
      position: 'relative', overflow: 'hidden',
    }}>
      {status !== 'loaded' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6,
        }}>
          {status === 'loading' && (
            <div style={{
              width: 20, height: 20, border: `2px solid ${color}15`,
              borderTop: `2px solid ${color}66`, borderRadius: '50%',
              animation: 'node-img-spin 0.8s linear infinite',
              marginBottom: 4,
            }} />
          )}
          <span style={{
            fontSize: height > 150 ? 42 : 28, fontWeight: 900,
            color: color + '18', letterSpacing: -1,
          }}>
            #{id}
          </span>
          <span style={{
            fontSize: height > 150 ? 10 : 8, color: color + '30',
            fontWeight: 700, letterSpacing: 2,
          }}>
            {rarity?.toUpperCase()}
          </span>
        </div>
      )}
      <img
        src={NODE_IMAGE_URL(id)}
        alt={`#${id}`}
        loading="lazy"
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: status === 'error' ? 'none' : 'block',
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          position: 'relative', zIndex: 1,
        }}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      <style>{`@keyframes node-img-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function WalletPage({ address, onBack, onSelectNode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setVisibleCount(BATCH_SIZE);
    fetchWallet(address)
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [address]);

  const nodes = data?.nodes || [];
  const visibleNodes = nodes.slice(0, visibleCount);
  const hasMore = visibleCount < nodes.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, nodes.length));
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [nodes.length, visibleCount, hasMore]);

  const totalHexes = data?.totalHexes ?? nodes.reduce((s, n) => s + (Number(n.hexesDecoded) || 0), 0);
  const totalHP = data?.totalHashpower ?? nodes.reduce((s, n) => s + (Number(n.hashpower) || 0), 0);
  const activeCount = data?.activeCount ?? nodes.filter(n => n.activity === 'Active').length;
  const rarityBreakdown = data?.rarities ?? (() => {
    const rb = {};
    for (const n of nodes) { const r = n.rarity || 'Common'; rb[r] = (rb[r] || 0) + 1; }
    return rb;
  })();

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#040804', color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
        padding: isMobile ? '10px 12px' : '12px 24px',
        borderBottom: '1px solid #142014',
        background: '#060b06', flexShrink: 0,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#111a11', border: '1px solid #1a2a1a', color: '#888',
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', fontWeight: 700,
          }}
        >
          BACK
        </button>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, fontWeight: 700 }}>WALLET</div>
        <div style={{
          fontSize: isMobile ? 10 : 13, color: '#60A5FA', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: isMobile ? '100%' : 'none',
          flex: isMobile ? '1 1 100%' : 'none',
        }}>
          {isMobile ? shortenAddr(address) : address}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 24 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#778', fontSize: 14 }}>
            Loading wallet data...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 60, color: '#EF4444', fontSize: 14 }}>
            Failed to load: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Wallet Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 6 : 12,
              marginBottom: isMobile ? 12 : 24,
            }}>
              {[
                { l: 'TOTAL NODES', v: nodes.length.toString(), c: '#4ADE80' },
                { l: 'ACTIVE', v: activeCount.toString(), c: '#60A5FA' },
                { l: 'TOTAL HEXES', v: totalHexes.toLocaleString(), c: '#C084FC' },
                { l: 'TOTAL HP', v: totalHP.toLocaleString(), c: '#FBBF24' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#0a120a', border: '1px solid #142014',
                  borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 20px',
                }}>
                  <div style={{ fontSize: isMobile ? 8 : 9, color: '#778', letterSpacing: 2, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Rarity Breakdown */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: isMobile ? 12 : 24, flexWrap: 'wrap',
            }}>
              {Object.entries(rarityBreakdown).map(([rarity, count]) => {
                const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;
                return (
                  <span key={rarity} style={{
                    fontSize: isMobile ? 9 : 11, color: '#000', background: cfg.color,
                    padding: isMobile ? '2px 8px' : '3px 12px', borderRadius: 4, fontWeight: 800,
                  }}>
                    {rarity.toUpperCase()} x{count}
                  </span>
                );
              })}
            </div>

            {/* Section Title */}
            <div style={{
              fontSize: 11, color: '#555', letterSpacing: 2, fontWeight: 700, marginBottom: 12,
            }}>
              NODES ({nodes.length})
            </div>

            {/* Node Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? 8 : 12,
            }}>
              {visibleNodes.map(n => {
                const cfg = RARITY_CONFIG[n.rarity] || RARITY_CONFIG.Common;
                const sc = STATUS_CONFIG[n.activity] || STATUS_CONFIG.Inactive;
                return (
                  <div
                    key={n.id}
                    onClick={() => onSelectNode(n)}
                    style={{
                      background: '#0a120a',
                      border: `1px solid ${cfg.color}22`,
                      borderRadius: 10, overflow: 'hidden',
                      cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = cfg.color + '66';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = cfg.color + '22';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <NodeImage id={n.id} rarity={n.rarity} color={cfg.color} height={isMobile ? 100 : 140} />
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 8, height: 8, borderRadius: '50%',
                        background: sc.color,
                        boxShadow: `0 0 6px ${sc.color}`,
                      }} />
                      <a
                        href={GUNZSCAN_NODE_URL(n.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute', bottom: 4, right: 4,
                          background: '#060b06cc', border: '1px solid #1a2a1a',
                          borderRadius: 4, padding: '2px 4px',
                          color: '#666', textDecoration: 'none',
                          display: 'flex', alignItems: 'center',
                          transition: 'color 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = cfg.color; e.currentTarget.style.borderColor = cfg.color + '66'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#1a2a1a'; }}
                        title="View on GunzScan"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>

                    <div style={{ padding: isMobile ? '8px 8px' : '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <span style={{ color: cfg.color, fontWeight: 800, fontSize: isMobile ? 12 : 14 }}>
                          #{n.id}
                        </span>
                        <span style={{
                          fontSize: 7, color: '#000', background: cfg.color,
                          padding: '1px 4px', borderRadius: 3, fontWeight: 800,
                        }}>
                          {n.rarity?.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? 9 : 10, color: '#888' }}>
                        <span>HEX {Number(n.hexesDecoded || 0).toLocaleString()}</span>
                        <span>HP {Number(n.hashpower || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div
                ref={sentinelRef}
                style={{
                  textAlign: 'center', padding: 24, color: '#555', fontSize: 11,
                }}
              >
                Loading more nodes... ({visibleCount}/{nodes.length})
              </div>
            )}

            {nodes.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#778', fontSize: 13 }}>
                No nodes found for this wallet
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
