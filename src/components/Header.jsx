import { formatNum } from '../utils/format';

export default function Header({ filteredCount, stats, lastUpdated, isMobile }) {
  const totals = stats?.totals;

  const statItems = [
    { l: 'SHOWING', v: filteredCount?.toLocaleString() || '—', c: '#4ADE80' },
    { l: 'ACTIVE', v: totals ? totals.active.toLocaleString() : '—', c: '#60A5FA' },
    { l: 'INACTIVE', v: totals ? totals.inactive.toLocaleString() : '—', c: '#EF4444' },
    { l: 'HEXES', v: totals ? formatNum(totals.totalHexes) : '—', c: '#FBBF24' },
    { l: 'HASHPOWER', v: totals ? formatNum(totals.activeHashpower) : '—', c: '#EF4444' },
  ];

  if (isMobile) {
    return (
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #142014',
        background: '#060b06', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <img src="/logo.png" alt="GRIDZILLA" style={{ height: 36 }} />
          <span style={{ fontSize: 9, color: '#778', padding: '1px 5px', border: '1px solid #1a2a1a', borderRadius: 4 }}>BETA</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {statItems.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 50 }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: '#778' }}>{s.l}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 20px', borderBottom: '1px solid #142014',
      background: '#060b06', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo.png" alt="GRIDZILLA" style={{ height: 70 }} />
        <span style={{ fontSize: 11, color: '#778', padding: '2px 6px', border: '1px solid #1a2a1a', borderRadius: 4 }}>BETA</span>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        {statItems.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#778', marginBottom: 2 }}>{s.l}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
