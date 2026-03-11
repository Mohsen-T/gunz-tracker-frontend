import { useState, useMemo } from 'react';
import { RARITY_CONFIG, STATUS_CONFIG } from '../utils/constants';
import { shortenAddr, formatPct } from '../utils/format';

const PAGE_SIZE = 25;

export default function Leaderboard({ nodes, onSelect, isMobile }) {
  const [sortKey, setSortKey] = useState('hexesDecoded');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...nodes];
    arr.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return arr;
  }, [nodes, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const thStyle = (key) => ({
    padding: isMobile ? '7px 4px' : '9px 10px', cursor: 'pointer', userSelect: 'none',
    color: sortKey === key ? '#4ADE80' : '#999',
    fontWeight: sortKey === key ? 700 : 400,
    whiteSpace: 'nowrap',
  });

  const arrow = (key) => sortKey === key ? (sortDir === 'desc' ? ' ▾' : ' ▴') : '';

  const btnStyle = (disabled) => ({
    background: disabled ? 'transparent' : '#142014',
    border: '1px solid #1a2a1a',
    borderRadius: 4, padding: isMobile ? '4px 6px' : '4px 10px', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? '#333' : '#4ADE80', fontSize: 11, fontWeight: 700,
    fontFamily: 'inherit',
  });

  // Mobile: card layout instead of table
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px' }}>
        {/* Sort controls */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 9, color: '#556', letterSpacing: 1 }}>SORT:</span>
          {[
            { k: 'hexesDecoded', l: 'HEXES' },
            { k: 'hashpower', l: 'HP' },
            { k: 'hexesDistributionRate', l: 'DIST%' },
          ].map(s => (
            <button
              key={s.k}
              onClick={() => toggleSort(s.k)}
              style={{
                background: sortKey === s.k ? '#142014' : 'transparent',
                border: `1px solid ${sortKey === s.k ? '#4ADE8044' : '#142014'}`,
                borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                color: sortKey === s.k ? '#4ADE80' : '#888',
                fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              {s.l}{arrow(s.k)}
            </button>
          ))}
        </div>

        {/* Card list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {paged.map((n, i) => {
            const cfg = RARITY_CONFIG[n.rarity] || RARITY_CONFIG.Common;
            const sc = STATUS_CONFIG[n.activity] || STATUS_CONFIG.Inactive;
            const rank = safePage * PAGE_SIZE + i + 1;
            return (
              <div
                key={n.id}
                onClick={() => onSelect(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', marginBottom: 4,
                  background: '#0a120a', borderRadius: 8,
                  border: '1px solid #0d150d', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: 11, color: rank <= 3 ? '#FBBF24' : '#555',
                  fontWeight: rank <= 3 ? 800 : 400, minWidth: 24,
                }}>
                  {rank}
                </span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: sc.color,
                  flexShrink: 0,
                }} />
                <span style={{ color: cfg.color, fontWeight: 800, fontSize: 13 }}>#{n.id}</span>
                <span style={{
                  fontSize: 8, color: '#000', background: cfg.color,
                  padding: '1px 5px', borderRadius: 3, fontWeight: 800,
                }}>
                  {n.rarity?.slice(0, 3).toUpperCase()}
                </span>
                <span style={{ marginLeft: 'auto', color: '#ccc', fontSize: 11, fontWeight: 700 }}>
                  {Number(n.hexesDecoded || 0).toLocaleString()}
                </span>
                <span style={{ color: '#666', fontSize: 10 }}>
                  HP {Number(n.hashpower || 0).toLocaleString()}
                </span>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#778', fontSize: 13 }}>
              No nodes match filters
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 0', borderTop: '1px solid #142014', flexShrink: 0,
          }}>
            <button style={btnStyle(safePage === 0)} onClick={() => setPage(0)} disabled={safePage === 0}>«</button>
            <button style={btnStyle(safePage === 0)} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}>‹</button>
            <span style={{ color: '#888', fontSize: 11, padding: '0 4px' }}>
              {safePage + 1} / {totalPages}
            </span>
            <button style={btnStyle(safePage >= totalPages - 1)} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>›</button>
            <button style={btnStyle(safePage >= totalPages - 1)} onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1}>»</button>
            <span style={{ color: '#556', fontSize: 10 }}>{sorted.length}</span>
          </div>
        )}
      </div>
    );
  }

  // Desktop: table layout
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px' }}>
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #142014', fontSize: 11, letterSpacing: 1.5, position: 'sticky', top: 0, background: '#040804', zIndex: 1 }}>
              <th style={{ ...thStyle('rank'), textAlign: 'left' }}>#</th>
              <th style={{ ...thStyle('id'), textAlign: 'left' }}>NODE</th>
              <th style={{ ...thStyle('rarity'), textAlign: 'left' }}>RARITY</th>
              <th style={{ ...thStyle('hexesDecoded'), textAlign: 'right' }} onClick={() => toggleSort('hexesDecoded')}>
                HEXES{arrow('hexesDecoded')}
              </th>
              <th style={{ ...thStyle('hexesDistributionRate'), textAlign: 'right' }} onClick={() => toggleSort('hexesDistributionRate')}>
                DIST %{arrow('hexesDistributionRate')}
              </th>
              <th style={{ ...thStyle('hashpower'), textAlign: 'right' }} onClick={() => toggleSort('hashpower')}>
                HP{arrow('hashpower')}
              </th>
              <th style={{ ...thStyle('activity'), textAlign: 'center' }}>STATUS</th>
              <th style={{ padding: '9px 10px', textAlign: 'left', color: '#999' }}>OWNER</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((n, i) => {
              const cfg = RARITY_CONFIG[n.rarity] || RARITY_CONFIG.Common;
              const sc = STATUS_CONFIG[n.activity] || STATUS_CONFIG.Inactive;
              const delta = Number(n.hexesDelta) || 0;
              const rank = safePage * PAGE_SIZE + i + 1;
              return (
                <tr
                  key={n.id}
                  onClick={() => onSelect(n)}
                  style={{ borderBottom: '1px solid #0d150d', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0a120a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{
                    padding: '8px 10px', fontSize: 12,
                    color: rank <= 3 ? '#FBBF24' : '#999',
                    fontWeight: rank <= 3 ? 800 : 400,
                  }}>
                    {rank}
                  </td>
                  <td style={{ padding: '8px 10px', color: cfg.color, fontWeight: 800 }}>#{n.id}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      fontSize: 11, color: '#000', background: cfg.color,
                      padding: '2px 8px', borderRadius: 3, fontWeight: 800,
                    }}>
                      {n.rarity?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#ddd', fontWeight: 700 }}>
                    {Number(n.hexesDecoded || 0).toLocaleString()}
                    {delta > 0 && (
                      <span style={{ color: '#4ADE80', fontSize: 11, marginLeft: 4 }}>+{delta}</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#888', fontSize: 12 }}>
                    {formatPct(n.hexesDistributionRate, 4)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#888' }}>
                    {Number(n.hashpower || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: sc.color, fontSize: 11, fontWeight: 700 }}>
                    {sc.icon} {sc.label}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#999', fontSize: 12 }}>
                    {shortenAddr(n.hackerWalletAddress)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#778', fontSize: 13 }}>
            No nodes match filters
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 0', borderTop: '1px solid #142014', flexShrink: 0,
        }}>
          <button style={btnStyle(safePage === 0)} onClick={() => setPage(0)} disabled={safePage === 0}>
            ««
          </button>
          <button style={btnStyle(safePage === 0)} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}>
            ‹ Prev
          </button>

          {/* Page numbers */}
          {(() => {
            const pages = [];
            let start = Math.max(0, safePage - 2);
            let end = Math.min(totalPages - 1, safePage + 2);
            if (end - start < 4) {
              if (start === 0) end = Math.min(totalPages - 1, 4);
              else start = Math.max(0, end - 4);
            }
            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{
                    background: i === safePage ? '#4ADE80' : 'transparent',
                    border: '1px solid #1a2a1a',
                    borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
                    color: i === safePage ? '#000' : '#888', fontSize: 11, fontWeight: 700,
                    fontFamily: 'inherit', minWidth: 28,
                  }}
                >
                  {i + 1}
                </button>
              );
            }
            return pages;
          })()}

          <button style={btnStyle(safePage >= totalPages - 1)} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
            Next ›
          </button>
          <button style={btnStyle(safePage >= totalPages - 1)} onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1}>
            »»
          </button>

          <span style={{ color: '#556', fontSize: 11, marginLeft: 8 }}>
            {sorted.length.toLocaleString()} nodes
          </span>
        </div>
      )}
    </div>
  );
}
