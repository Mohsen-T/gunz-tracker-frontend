import { useState, useMemo } from 'react';
import { RARITY_CONFIG, RARITY_ORDER } from '../utils/constants';
import { formatNum } from '../utils/format';

function StatsTab({ stats, hexes, hashpower, onSelectNode }) {
  const totals = stats?.totals;
  const activity = stats?.activity || {};
  const topMovers = stats?.topMovers || [];

  const hexDates = hexes ? Object.keys(hexes) : [];
  const hexValues = hexes ? Object.values(hexes) : [];
  const hpValues = hashpower ? Object.values(hashpower) : [];

  return (
    <div style={{ padding: 10, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>ECOSYSTEM</div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 12 }}>
        {[
          { l: 'TOTAL', v: totals ? formatNum(totals.totalHexes) : '—', c: '#4ADE80' },
          { l: 'HASHPOWER', v: totals ? formatNum(totals.activeHashpower) : '—', c: '#FBBF24' },
          { l: 'ACTIVE', v: totals ? totals.active.toLocaleString() : '—', c: '#60A5FA' },
          { l: 'INACTIVE', v: totals ? totals.inactive.toLocaleString() : '—', c: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0a120a', borderRadius: 6, padding: 7, border: '1px solid #0d150d' }}>
            <div style={{ fontSize: 9, color: '#778', letterSpacing: 1.5, marginBottom: 2 }}>{s.l}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Daily HEXes Chart */}
      {hexValues.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>DAILY HEXES</div>
          <div style={{
            height: 70, display: 'flex', alignItems: 'flex-end', gap: 1,
            background: '#0a120a', borderRadius: 6, padding: '6px 3px 3px',
            border: '1px solid #0d150d', marginBottom: 12,
          }}>
            {hexValues.map((v, i) => {
              const mx = Math.max(...hexValues);
              return (
                <div key={i} style={{
                  flex: 1, height: mx > 0 ? (v / mx) * 58 : 0,
                  borderRadius: 1, minHeight: 1,
                  background: 'linear-gradient(to top, #4ADE8033, #4ADE80AA)',
                }} />
              );
            })}
          </div>
        </>
      )}

      {/* Nodes by Rarity */}
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>NODES</div>
      {RARITY_ORDER.map(r => {
        const cfg = RARITY_CONFIG[r];
        const data = activity[r] || {};
        const active = data.Active || 0;
        const inactive = data.Inactive || 0;
        const total = active + inactive;
        const pctA = total > 0 ? (active / total) * 100 : 0;
        return (
          <div key={r} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 11 }}>
              <span style={{ color: cfg.color, fontWeight: 700 }}>{r.toUpperCase()}</span>
              <span style={{ color: '#999', fontSize: 10 }}>
                <span style={{ color: '#4ADE80' }}>{active}</span>
                <span style={{ color: '#778' }}> / {total}</span>
              </span>
            </div>
            <div style={{ height: 5, background: '#0d150d', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: pctA + '%', background: cfg.color, borderRadius: '3px 0 0 3px' }} />
            </div>
          </div>
        );
      })}

      {/* Hashpower Trend */}
      {hpValues.length > 0 && (
        <>
          <div style={{ marginTop: 14, fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>HASHPOWER TREND</div>
          <div style={{
            height: 50, display: 'flex', alignItems: 'flex-end', gap: 1,
            background: '#0a120a', borderRadius: 6, padding: '6px 3px 3px',
            border: '1px solid #0d150d',
          }}>
            {hpValues.map((v, i) => {
              const mn = Math.min(...hpValues);
              const mx = Math.max(...hpValues);
              const h = mx > mn ? ((v - mn) / (mx - mn)) * 40 + 5 : 20;
              return (
                <div key={i} style={{
                  flex: 1, height: h, borderRadius: 1, minHeight: 1,
                  background: 'linear-gradient(to top, #FBBF2433, #FBBF24AA)',
                }} />
              );
            })}
          </div>
        </>
      )}

      {/* Top Movers */}
      {topMovers.length > 0 && (
        <>
          <div style={{ marginTop: 14, fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 5, fontWeight: 700 }}>
            TOP MOVERS (since last sync)
          </div>
          {topMovers.slice(0, 20).map((m, i) => (
            <div key={i} onClick={() => onSelectNode && onSelectNode(m)} style={{
              display: 'flex', justifyContent: 'space-between', padding: '4px 6px',
              marginBottom: 2, background: '#0a120a', borderRadius: 4,
              border: '1px solid #0d150d', fontSize: 11, cursor: 'pointer',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#101a10'}
              onMouseLeave={e => e.currentTarget.style.background = '#0a120a'}
            >
              <span style={{ color: (RARITY_CONFIG[m.rarity] || RARITY_CONFIG.Common).color, fontWeight: 800 }}>#{m.id}</span>
              <span style={{ color: '#4ADE80', fontWeight: 700 }}>+{Number(m.delta).toLocaleString()}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function FeedTab({ nodes, onSelectNode }) {
  const events = useMemo(() => {
    const active = nodes.filter(n => n.activity === 'Active');
    if (active.length === 0) return [];
    const items = [
      'Fierce Survivalist Skin', 'Bloody Knees', 'Apex Predator Skin',
      'Terikon Stock', 'Patriotic Mascot', 'Bushy Mutton Chops',
      'Optimist Skin', 'Neural Interface', 'Tactical Vest', 'HEX Decoder',
    ];
    const rarities = ['Unc', 'Rar', 'Epc', 'Unc', 'Rar', 'Rar', 'Unc', 'Epc', 'Unc', 'Unc'];
    const rColors = { Unc: '#4ADE80', Rar: '#60A5FA', Epc: '#C084FC' };

    return Array.from({ length: 20 }, (_, i) => {
      const node = active[Math.floor(Math.random() * active.length)];
      const idx = Math.floor(Math.random() * items.length);
      return {
        id: i, node, item: items[idx], ir: rarities[idx], irc: rColors[rarities[idx]],
        time: i === 0 ? 'now' : i < 5 ? `${i}m` : `${i * 3}m`,
      };
    });
  }, [nodes]);

  return (
    <div style={{ padding: 10, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
        LIVE DECODE FEED
      </div>
      {events.length === 0 && (
        <div style={{ color: '#778', fontSize: 12, padding: 10 }}>Loading nodes...</div>
      )}
      {events.map(e => (
        <div key={e.id} onClick={() => onSelectNode && onSelectNode(e.node)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px',
          marginBottom: 2, background: '#0a120a', borderRadius: 5,
          border: '1px solid #0d150d', fontSize: 11, cursor: 'pointer',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#101a10'}
          onMouseLeave={e => e.currentTarget.style.background = '#0a120a'}
        >
          <span style={{
            color: (RARITY_CONFIG[e.node.rarity] || RARITY_CONFIG.Common).color,
            fontWeight: 800, minWidth: 38,
          }}>
            #{e.node.id}
          </span>
          <span style={{ color: '#666' }}>→</span>
          <span style={{
            color: '#999', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {e.item}
          </span>
          <span style={{ color: e.irc, fontSize: 9, fontWeight: 800 }}>{e.ir.toUpperCase()}</span>
          <span style={{ color: '#555', fontSize: 9, minWidth: 24, textAlign: 'right' }}>{e.time}</span>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ stats, hexes, hashpower, nodes, isMobile, onClose, onSelectNode }) {
  const [tab, setTab] = useState('stats');
  const handleSelectNode = (node) => {
    if (onSelectNode) onSelectNode(node);
    if (isMobile && onClose) onClose();
  };

  return (
    <div style={{
      width: isMobile ? '100%' : 250,
      borderLeft: isMobile ? 'none' : '1px solid #142014',
      background: '#060b06',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      ...(isMobile ? {
        position: 'absolute', inset: 0, zIndex: 200,
      } : {}),
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #142014' }}>
        {[
          { k: 'stats', l: 'STATS' },
          { k: 'feed', l: 'LIVE' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              flex: 1,
              background: tab === t.k ? '#0a120a' : 'transparent',
              border: 'none',
              borderBottom: tab === t.k ? '2px solid #4ADE80' : '2px solid transparent',
              padding: '8px 0', cursor: 'pointer',
              color: tab === t.k ? '#4ADE80' : '#888',
              fontSize: 11, fontWeight: 700, fontFamily: 'inherit', letterSpacing: 2,
            }}
          >
            {t.l}
          </button>
        ))}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#888',
              padding: '8px 14px', cursor: 'pointer', fontSize: 14,
              fontFamily: 'inherit', fontWeight: 700,
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'stats'
          ? <StatsTab stats={stats} hexes={hexes} hashpower={hashpower} onSelectNode={handleSelectNode} />
          : <FeedTab nodes={nodes} onSelectNode={handleSelectNode} />
        }
      </div>
    </div>
  );
}
