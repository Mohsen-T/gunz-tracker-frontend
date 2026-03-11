import { useState, useEffect } from 'react';
import { RARITY_CONFIG, STATUS_CONFIG, RESALE_RATES, ITEM_RARITY_COLORS, NODE_IMAGE_URL, GUNZSCAN_NODE_URL, GUNZSCAN_ITEM_URL } from '../utils/constants';
import { formatNum, shortenAddr, formatPct } from '../utils/format';
import { fetchNode, fetchWallet, fetchNodeEarnings, fetchDecodedItems, fetchLicenseInfo, fetchGameItems } from '../services/api';

function NodeImage({ id, rarity, color, height = 180 }) {
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
              width: 22, height: 22, border: `2px solid ${color}15`,
              borderTop: `2px solid ${color}66`, borderRadius: '50%',
              animation: 'node-img-spin 0.8s linear infinite',
              marginBottom: 4,
            }} />
          )}
          <span style={{
            fontSize: 42, fontWeight: 900, color: color + '15',
            letterSpacing: -2,
          }}>
            #{id}
          </span>
          <span style={{
            fontSize: 10, color: color + '25', fontWeight: 700,
            letterSpacing: 3,
          }}>
            {rarity?.toUpperCase()}
          </span>
        </div>
      )}
      <img
        src={NODE_IMAGE_URL(id)}
        alt={`#${id}`}
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

function PeriodSelector({ value, onChange }) {
  const periods = [
    { k: 'week', l: '7D' },
    { k: 'month', l: '30D' },
    { k: 'quarter', l: '90D' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {periods.map(p => (
        <button
          key={p.k}
          onClick={() => onChange(p.k)}
          style={{
            background: value === p.k ? '#142014' : 'transparent',
            border: value === p.k ? '1px solid #4ADE8044' : '1px solid #142014',
            color: value === p.k ? '#4ADE80' : '#666',
            padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
            fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          {p.l}
        </button>
      ))}
    </div>
  );
}

function BarChart({ data, color, labelKey, valueKey }) {
  if (!data || data.length === 0) return null;
  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxV = Math.max(...values, 1);
  return (
    <div>
      <div style={{
        height: 90, display: 'flex', alignItems: 'flex-end', gap: 1,
        background: '#0a120a', borderRadius: 8, padding: '10px 4px 4px',
        border: '1px solid #142014',
      }}>
        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0;
          const h = maxV > 0 ? (val / maxV) * 70 : 0;
          return (
            <div
              key={i}
              title={`${d[labelKey]}: ${val.toLocaleString()}`}
              style={{
                flex: 1, height: h,
                background: `linear-gradient(to top, ${color}44, ${color}AA)`,
                borderRadius: 2, minHeight: 1, cursor: 'default',
              }}
            />
          );
        })}
      </div>
      {data.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#778' }}>
          <span>{data[0]?.[labelKey]}</span>
          <span>{data[data.length - 1]?.[labelKey]}</span>
        </div>
      )}
    </div>
  );
}

export default function DetailPanel({ node, onClose, onSelect, onOpenWallet, onFilterOwner, isMobile }) {
  if (!node) return null;

  const [detail, setDetail] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerNodes, setOwnerNodes] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [showOwner, setShowOwner] = useState(false);

  // Earnings & Decoded Items
  const [earningsPeriod, setEarningsPeriod] = useState('month');
  const [earnings, setEarnings] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [decodedPeriod, setDecodedPeriod] = useState('month');
  const [decodedItems, setDecodedItems] = useState(null);
  const [decodedLoading, setDecodedLoading] = useState(false);
  // Game Items (from Blockscout on-chain data)
  const [gameItems, setGameItems] = useState(null);
  const [gameItemsLoading, setGameItemsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOwnerNodes(null);
    setShowOwner(false);
    setEarnings(null);
    setDecodedItems(null);
    setGameItems(null);
    setLicenseInfo(null);

    // Fetch node detail + license info in parallel
    Promise.all([
      fetchNode(node.id).catch(() => null),
      fetchLicenseInfo(node.id).catch(() => null),
    ]).then(([d, info]) => {
      if (cancelled) return;
      if (d) setDetail(d);
      if (info) setLicenseInfo(info);
    }).finally(() => { if (!cancelled) setLoading(false); });

    // Fetch Game Items from Blockscout (separate call, may be slower)
    setGameItemsLoading(true);
    fetchGameItems(node.id)
      .then(data => { if (!cancelled && data?.items) setGameItems(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setGameItemsLoading(false); });

    return () => { cancelled = true; };
  }, [node.id]);

  // Fetch GUN earnings when period changes
  useEffect(() => {
    let cancelled = false;
    setEarningsLoading(true);
    fetchNodeEarnings(node.id, earningsPeriod)
      .then(d => { if (!cancelled) setEarnings(d); })
      .catch(() => { if (!cancelled) setEarnings(null); })
      .finally(() => { if (!cancelled) setEarningsLoading(false); });
    return () => { cancelled = true; };
  }, [node.id, earningsPeriod]);

  // Fetch decoded items breakdown when period changes
  useEffect(() => {
    let cancelled = false;
    setDecodedLoading(true);
    fetchDecodedItems(node.id, decodedPeriod)
      .then(d => { if (!cancelled) setDecodedItems(d); })
      .catch(() => { if (!cancelled) setDecodedItems(null); })
      .finally(() => { if (!cancelled) setDecodedLoading(false); });
    return () => { cancelled = true; };
  }, [node.id, decodedPeriod]);

  const loadOwnerNodes = () => {
    const addr = n.hackerWalletAddress;
    if (!addr || ownerLoading) return;
    setShowOwner(true);
    if (ownerNodes) return;
    setOwnerLoading(true);
    fetchWallet(addr)
      .then(data => setOwnerNodes(data))
      .catch(() => {})
      .finally(() => setOwnerLoading(false));
  };

  const cfg = RARITY_CONFIG[node.rarity] || RARITY_CONFIG.Common;
  const sc = STATUS_CONFIG[node.activity] || STATUS_CONFIG.Inactive;

  // Use detail if loaded, fall back to summary node data
  const n = detail || node;
  const history = detail?.history || [];

  // Parse earnings data — API returns [{date, value}]
  const earningsData = (() => {
    if (!earnings) return [];
    if (Array.isArray(earnings)) return earnings;
    return [];
  })();

  // Total earnings from earningsData or licenseInfo
  const totalEarned = licenseInfo?.earnedFee ?? (
    earningsData.length > 0
      ? earningsData.reduce((s, d) => s + (Number(d.value) || 0), 0)
      : null
  );

  // Parse decoded items — API now returns [{date, value}] from on-chain events
  const decodedChartData = (() => {
    if (!decodedItems) return [];
    if (Array.isArray(decodedItems)) return decodedItems;
    return [];
  })();

  // Total decoded items count
  const totalDecoded = decodedChartData.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // Game Items list
  const gameItemList = gameItems?.items || [];

  return (
    <div
      style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: isMobile ? '100%' : 420,
        background: '#060b06f8', borderLeft: isMobile ? 'none' : `1px solid ${cfg.color}22`,
        overflowY: 'auto', zIndex: 100,
        fontFamily: "'JetBrains Mono', monospace",
        backdropFilter: 'blur(30px)',
      }}
    >
      <div style={{ padding: isMobile ? 14 : 24 }}>
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: '#111a11', border: '1px solid #1a2a1a', color: '#666',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            ✕
          </button>
        </div>

        {/* Node Image */}
        <div style={{
          marginBottom: 16, borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${cfg.color}33`,
        }}>
          <NodeImage id={n.id} rarity={n.rarity} color={cfg.color} height={isMobile ? 150 : 180} />
        </div>

        {/* Header Info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: cfg.color, letterSpacing: -1 }}>
              #{n.id}
            </span>
            <span style={{
              fontSize: isMobile ? 11 : 13, color: '#000', background: cfg.color,
              padding: '3px 12px', borderRadius: 5, fontWeight: 800,
            }}>
              {n.rarity?.toUpperCase()}
            </span>
            {detail?.rank && (
              <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700 }}>
                RANK #{detail.rank}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 11 : 13, flexWrap: 'wrap' }}>
            <span style={{ color: sc.color, fontWeight: 700 }}>
              {sc.icon} {sc.label}
            </span>
            <span style={{ color: '#666' }}>|</span>
            <span
              onClick={() => {
                if (onOpenWallet && n.hackerWalletAddress) {
                  onOpenWallet(n.hackerWalletAddress);
                } else {
                  loadOwnerNodes();
                }
              }}
              style={{ color: '#60A5FA', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#60A5FA44' }}
            >
              {shortenAddr(n.hackerWalletAddress)}
            </span>
            {onFilterOwner && n.hackerWalletAddress && (
              <button
                onClick={() => onFilterOwner(n.hackerWalletAddress)}
                title="Show only this owner's nodes in bubbles"
                style={{
                  background: '#111a11', border: '1px solid #1a2a1a', color: '#778',
                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                  fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE8066'; e.currentTarget.style.color = '#4ADE80'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2a1a'; e.currentTarget.style.color = '#778'; }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <circle cx="6" cy="6" r="3" opacity="0.8" />
                  <circle cx="18" cy="8" r="4" opacity="0.9" />
                  <circle cx="10" cy="16" r="5" />
                  <circle cx="20" cy="18" r="2.5" opacity="0.7" />
                </svg>
                Portfolio
              </button>
            )}
          </div>

          {/* GunzScan Link */}
          <a
            href={GUNZSCAN_NODE_URL(n.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '7px 14px', borderRadius: 6,
              background: '#111a11', border: '1px solid #1a2a1a',
              color: '#aaa', fontSize: 11, fontWeight: 700,
              textDecoration: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color + '66'; e.currentTarget.style.color = cfg.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2a1a'; e.currentTarget.style.color = '#aaa'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View on GunzScan
          </a>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 6 : 10, marginBottom: 20 }}>
          {[
            { l: 'HEXES DECODED', v: Number(n.hexesDecoded || 0).toLocaleString(), c: cfg.color },
            { l: 'HASHPOWER', v: Number(n.hashpower || 0).toLocaleString(), c: '#FBBF24' },
            { l: 'GUN EARNED', v: totalEarned != null ? Number(totalEarned).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—', c: '#F97316' },
            { l: 'CAPACITY', v: licenseInfo?.capacity != null ? Number(licenseInfo.capacity).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—', c: '#60A5FA' },
            { l: 'DISTRIBUTION', v: formatPct(n.hexesDistributionRate, 5), c: '#818CF8' },
            { l: 'ACTIVITY', v: formatPct(n.activityPeriodPercent, 2), c: '#4ADE80' },
            { l: 'HP SHARE', v: formatPct(n.totalHashpowerPercent, 4), c: '#C084FC' },
            { l: 'RESALE RATE', v: RESALE_RATES[n.rarity] || '—', c: '#EF4444' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#0a120a', border: '1px solid #142014',
              borderRadius: 10, padding: isMobile ? '10px 10px' : '12px 14px',
            }}>
              <div style={{ fontSize: isMobile ? 8 : 10, color: '#889', letterSpacing: 1.8, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* History Chart */}
        {history.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
              HISTORICAL HEXES ({history.length}d)
            </div>
            <BarChart
              data={history}
              color={cfg.color}
              labelKey="date"
              valueKey="hexesDecoded"
            />
          </div>
        )}

        {/* GUN Earnings Chart */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, fontWeight: 700 }}>
              GUN EARNINGS
              {earningsData.length > 0 && (
                <span style={{ color: '#F97316', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
                  ({earningsData.reduce((s, d) => s + (Number(d.value) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} GUN)
                </span>
              )}
            </div>
            <PeriodSelector value={earningsPeriod} onChange={setEarningsPeriod} />
          </div>
          {earningsLoading && (
            <div style={{ color: '#778', fontSize: 11, padding: 8 }}>Loading...</div>
          )}
          {!earningsLoading && earningsData.length > 0 && (
            <BarChart
              data={earningsData}
              color="#F97316"
              labelKey="date"
              valueKey="value"
            />
          )}
          {!earningsLoading && earningsData.length === 0 && (
            <a
              href={GUNZSCAN_NODE_URL(n.id)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', color: '#666', fontSize: 11, padding: 12, textAlign: 'center',
                background: '#0a120a', borderRadius: 8, border: '1px solid #142014',
                textDecoration: 'none', transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.borderColor = '#F9731644'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#142014'; }}
            >
              View detailed earnings on GunzScan
            </a>
          )}
        </div>

        {/* Decoded Items Chart (daily decode count from on-chain events) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, fontWeight: 700 }}>
              DECODED ITEMS
              {totalDecoded > 0 && (
                <span style={{ color: '#778', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
                  ({totalDecoded} total)
                </span>
              )}
            </div>
            <PeriodSelector value={decodedPeriod} onChange={setDecodedPeriod} />
          </div>
          {decodedLoading && (
            <div style={{ color: '#778', fontSize: 11, padding: 8 }}>Loading...</div>
          )}
          {!decodedLoading && decodedChartData.length > 0 && (
            <BarChart
              data={decodedChartData}
              color="#C084FC"
              labelKey="date"
              valueKey="value"
            />
          )}
          {!decodedLoading && decodedChartData.length === 0 && (
            <a
              href={GUNZSCAN_NODE_URL(n.id)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', color: '#666', fontSize: 11, padding: 12, textAlign: 'center',
                background: '#0a120a', borderRadius: 8, border: '1px solid #142014',
                textDecoration: 'none', transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C084FC'; e.currentTarget.style.borderColor = '#C084FC44'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#142014'; }}
            >
              View decoded items on GunzScan
            </a>
          )}
        </div>

        {/* Game Items (on-chain from Blockscout) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
            ITEMS
            {gameItemList.length > 0 && (
              <span style={{ color: '#778', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
                ({gameItemList.length})
              </span>
            )}
          </div>
          {gameItemsLoading && (
            <div style={{
              color: '#778', fontSize: 11, padding: 20, textAlign: 'center',
              background: '#0a120a', borderRadius: 8, border: '1px solid #142014',
            }}>
              <div style={{
                width: 18, height: 18, border: '2px solid #14201415',
                borderTop: '2px solid #4ADE8066', borderRadius: '50%',
                animation: 'node-img-spin 0.8s linear infinite',
                margin: '0 auto 8px',
              }} />
              Loading items from chain...
            </div>
          )}
          {!gameItemsLoading && gameItemList.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              maxHeight: 480, overflowY: 'auto',
            }}>
              {gameItemList.map((item) => {
                const rarColor = ITEM_RARITY_COLORS[item.rarity] || '#4ADE80';
                return (
                  <a
                    key={item.id}
                    href={GUNZSCAN_ITEM_URL(item.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#0a0f0a', border: '1px solid #142014',
                      borderRadius: 10, padding: 0, display: 'flex', flexDirection: 'column',
                      textDecoration: 'none', overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = rarColor + '66'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#142014'; }}
                  >
                    {/* Item Image */}
                    <div style={{
                      width: '100%', height: isMobile ? 90 : 110, background: '#060906',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            maxWidth: '90%', maxHeight: '90%', objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28, color: '#142014' }}>?</span>
                      )}
                    </div>
                    {/* Item Info */}
                    <div style={{ padding: '8px 10px 10px' }}>
                      <div style={{
                        fontSize: 10, color: '#ddd', fontWeight: 700,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: rarColor, display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 9, color: rarColor, fontWeight: 700 }}>
                          {item.rarity}
                        </span>
                      </div>
                      {item.owner && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#556',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span style={{ opacity: 0.8 }}>
                            {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
          {!gameItemsLoading && gameItemList.length === 0 && (
            <a
              href={GUNZSCAN_NODE_URL(n.id)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', color: '#556', fontSize: 11, padding: 20, textAlign: 'center',
                background: '#0a120a', borderRadius: 8, border: '1px solid #142014',
                textDecoration: 'none', transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#4ADE80'; e.currentTarget.style.borderColor = '#4ADE8044'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#556'; e.currentTarget.style.borderColor = '#142014'; }}
            >
              No items found — View on GunzScan
            </a>
          )}
        </div>

        {/* Owner's Other Nodes */}
        {showOwner && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
              OWNER&apos;S NODES
              {ownerNodes && (
                <span style={{ color: '#778', fontWeight: 400, letterSpacing: 0, marginLeft: 8 }}>
                  {ownerNodes.nodeCount} nodes • {Number(ownerNodes.totalHexes || 0).toLocaleString()} HEXes
                </span>
              )}
            </div>
            {ownerLoading && (
              <div style={{ color: '#778', fontSize: 12, padding: 10 }}>Loading owner data...</div>
            )}
            {ownerNodes && (
              <div style={{
                maxHeight: 200, overflowY: 'auto', borderRadius: 8,
                border: '1px solid #142014', background: '#0a120a',
              }}>
                {ownerNodes.nodes.map(on => {
                  const oc = RARITY_CONFIG[on.rarity] || RARITY_CONFIG.Common;
                  const osc = STATUS_CONFIG[on.activity] || STATUS_CONFIG.Inactive;
                  const isCurrent = String(on.id) === String(n.id);
                  return (
                    <div
                      key={on.id}
                      onClick={() => !isCurrent && onSelect?.(on)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 12px', cursor: isCurrent ? 'default' : 'pointer',
                        borderBottom: '1px solid #0d150d',
                        background: isCurrent ? '#142014' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#0d150d'; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ color: oc.color, fontWeight: 800, fontSize: 12, minWidth: 45 }}>
                        #{on.id}
                      </span>
                      <span style={{
                        fontSize: 9, color: '#000', background: oc.color,
                        padding: '1px 6px', borderRadius: 3, fontWeight: 800,
                      }}>
                        {on.rarity?.toUpperCase()}
                      </span>
                      <span style={{ color: osc.color, fontSize: 10, fontWeight: 700 }}>
                        {osc.icon}
                      </span>
                      <span style={{ color: '#999', fontSize: 11, marginLeft: 'auto' }}>
                        {Number(on.hexesDecoded || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Loading state for detail */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#778', fontSize: 13 }}>
            Loading node detail...
          </div>
        )}

        {/* Status message for inactive nodes */}
        {n.activity !== 'Active' && !loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#778', fontSize: 13, background: '#0a120a', borderRadius: 8, border: '1px solid #142014' }}>
            Node is inactive — 0 HEXes decoded
          </div>
        )}
      </div>
    </div>
  );
}
