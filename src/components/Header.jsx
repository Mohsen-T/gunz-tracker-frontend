import { formatNum } from '../utils/format';

export default function Header({ filteredCount, stats, lastUpdated, isMobile, onNavigate, currentPage }) {
  const totals = stats?.totals;

  const statItems = [
    { l: 'SHOWING', v: filteredCount?.toLocaleString() || '—', c: '#4ADE80' },
    { l: 'ACTIVE', v: totals ? totals.active.toLocaleString() : '—', c: '#60A5FA' },
    { l: 'INACTIVE', v: totals ? totals.inactive.toLocaleString() : '—', c: '#EF4444' },
    { l: 'HEXES', v: totals ? formatNum(totals.totalHexes) : '—', c: '#FBBF24' },
    { l: 'HASHPOWER', v: totals ? formatNum(totals.activeHashpower) : '—', c: '#EF4444' },
  ];

  const navItems = [
    { id: 'app', label: 'TRACKER' },
    { id: 'marketplace', label: 'MARKETPLACE' },
  ];

  if (isMobile) {
    return (
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #142014',
        background: '#060b06', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <img src="/logo.png" alt="GRIDZILLA" style={{ height: 36 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {navItems.map(nav => (
              <button
                key={nav.id}
                onClick={() => onNavigate?.(nav.id)}
                style={{
                  background: currentPage === nav.id ? '#4ADE8015' : 'transparent',
                  border: `1px solid ${currentPage === nav.id ? '#4ADE8044' : '#1a2a1a'}`,
                  borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
                  color: currentPage === nav.id ? '#4ADE80' : '#556',
                  fontSize: 8, fontWeight: 700, fontFamily: 'inherit',
                  letterSpacing: 1,
                }}
              >
                {nav.label}
              </button>
            ))}
            <span style={{ fontSize: 9, color: '#778', padding: '1px 5px', border: '1px solid #1a2a1a', borderRadius: 4 }}>BETA</span>
          </div>
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
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {navItems.map(nav => (
            <button
              key={nav.id}
              onClick={() => onNavigate?.(nav.id)}
              style={{
                background: currentPage === nav.id ? '#4ADE8018' : 'transparent',
                border: `1px solid ${currentPage === nav.id ? '#4ADE8044' : '#1a2a1a'}`,
                borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
                color: currentPage === nav.id ? '#4ADE80' : '#667',
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                letterSpacing: 2, transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (currentPage !== nav.id) {
                  e.currentTarget.style.color = '#aaa';
                  e.currentTarget.style.borderColor = '#2a3a2a';
                }
              }}
              onMouseLeave={e => {
                if (currentPage !== nav.id) {
                  e.currentTarget.style.color = '#667';
                  e.currentTarget.style.borderColor = '#1a2a1a';
                }
              }}
            >
              {nav.label}
            </button>
          ))}
        </div>
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
