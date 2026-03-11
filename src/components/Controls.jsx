import { RARITY_CONFIG, RARITY_ORDER } from '../utils/constants';

export default function Controls({ search, onSearch, filters, onFilters, view, onView, activityCounts, onReset, isMobile, onToggleSidebar }) {
  const hasActiveFilter = search || filters.rarity.length > 0 || filters.status !== 'all';

  const toggleRarity = (r) => {
    onFilters(f => ({
      ...f,
      rarity: f.rarity.includes(r) ? f.rarity.filter(x => x !== r) : [...f.rarity, r],
    }));
  };

  if (isMobile) {
    return (
      <div style={{
        padding: '6px 10px', borderBottom: '1px solid #142014',
        background: '#060b06', flexShrink: 0,
      }}>
        {/* Row 1: Search + View + Sidebar toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="ID or wallet..."
              value={search}
              onChange={e => onSearch(e.target.value)}
              style={{
                background: '#0a120a', border: '1px solid #142014', borderRadius: 6,
                padding: '6px 10px 6px 26px', color: '#ddd', fontSize: 12,
                width: '100%', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <span style={{ position: 'absolute', left: 8, top: 7, fontSize: 12, color: '#999' }}>⌕</span>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #142014', flexShrink: 0 }}>
            {[
              { k: 'bubbles', l: '◉' },
              { k: 'leaderboard', l: '⊞' },
            ].map(v => (
              <button
                key={v.k}
                onClick={() => onView(v.k)}
                style={{
                  background: view === v.k ? '#142014' : 'transparent',
                  border: 'none', padding: '5px 10px', cursor: 'pointer',
                  color: view === v.k ? '#4ADE80' : '#888', fontSize: 13,
                  fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                {v.l}
              </button>
            ))}
          </div>

          {/* Sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'transparent', border: '1px solid #142014',
              borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
              color: '#888', fontSize: 13, fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            ☰
          </button>
        </div>

        {/* Row 2: Rarity filters + Status + Reset */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {RARITY_ORDER.map(r => {
            const cfg = RARITY_CONFIG[r];
            const on = filters.rarity.length === 0 || filters.rarity.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggleRarity(r)}
                style={{
                  background: on ? cfg.color + '15' : 'transparent',
                  border: `1px solid ${on ? cfg.color + '44' : '#142014'}`,
                  borderRadius: 4, padding: '3px 5px', cursor: 'pointer',
                  color: on ? cfg.color : '#666', fontSize: 9, fontWeight: 700,
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: on ? cfg.color : '#444' }} />
                {r.slice(0, 3).toUpperCase()}
              </button>
            );
          })}

          <div style={{ width: 1, height: 16, background: '#142014' }} />

          {/* Status Toggle */}
          <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid #142014' }}>
            {[
              { key: 'all', label: 'ALL', color: '#888' },
              { key: 'Active', label: 'ON', color: '#4ADE80' },
              { key: 'Inactive', label: 'OFF', color: '#EF4444' },
            ].map(s => {
              const isOn = filters.status === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => onFilters(f => ({ ...f, status: s.key }))}
                  style={{
                    background: isOn ? s.color + '18' : 'transparent',
                    border: 'none', padding: '3px 7px', cursor: 'pointer',
                    color: isOn ? s.color : '#666', fontSize: 9, fontWeight: 700,
                    fontFamily: 'inherit', borderRight: '1px solid #142014',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <button
              onClick={onReset}
              style={{
                background: '#EF444418', border: '1px solid #EF444444',
                borderRadius: 4, padding: '3px 6px', cursor: 'pointer',
                color: '#EF4444', fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px',
      borderBottom: '1px solid #142014', background: '#060b06',
      flexShrink: 0, flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="ID or wallet..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{
            background: '#0a120a', border: '1px solid #142014', borderRadius: 6,
            padding: '6px 10px 6px 28px', color: '#ddd', fontSize: 13,
            width: 180, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <span style={{ position: 'absolute', left: 9, top: 7, fontSize: 13, color: '#999' }}>⌕</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#142014' }} />

      {/* Rarity Filters */}
      {RARITY_ORDER.map(r => {
        const cfg = RARITY_CONFIG[r];
        const on = filters.rarity.length === 0 || filters.rarity.includes(r);
        const count = activityCounts?.[r]
          ? Object.values(activityCounts[r]).reduce((s, v) => s + v, 0)
          : '—';
        return (
          <button
            key={r}
            onClick={() => toggleRarity(r)}
            style={{
              background: on ? cfg.color + '15' : 'transparent',
              border: `1px solid ${on ? cfg.color + '44' : '#142014'}`,
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              color: on ? cfg.color : '#666', fontSize: 11, fontWeight: 700,
              fontFamily: 'inherit', letterSpacing: 0.5, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? cfg.color : '#444' }} />
            {r.toUpperCase()}
            <span style={{ color: on ? cfg.color + '77' : '#555', fontSize: 10 }}>
              {typeof count === 'number' ? count.toLocaleString() : count}
            </span>
          </button>
        );
      })}

      <div style={{ width: 1, height: 20, background: '#142014' }} />

      {/* Status Toggle */}
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #142014' }}>
        {[
          { key: 'all', label: 'ALL', color: '#888' },
          { key: 'Active', label: 'ACTIVE', color: '#4ADE80' },
          { key: 'Inactive', label: 'INACTIVE', color: '#EF4444' },
        ].map(s => {
          const isOn = filters.status === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onFilters(f => ({ ...f, status: s.key }))}
              style={{
                background: isOn ? s.color + '18' : 'transparent',
                border: 'none', padding: '4px 10px', cursor: 'pointer',
                color: isOn ? s.color : '#666', fontSize: 11, fontWeight: 700,
                fontFamily: 'inherit', letterSpacing: 0.5, transition: 'all 0.15s',
                borderRight: '1px solid #142014',
              }}
            >
              {s.key !== 'all' && (
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: isOn ? s.color : '#444', marginRight: 4,
                }} />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Reset Button */}
      {hasActiveFilter && (
        <button
          onClick={onReset}
          style={{
            background: '#EF444418',
            border: '1px solid #EF444444',
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
            color: '#EF4444', fontSize: 11, fontWeight: 700,
            fontFamily: 'inherit', letterSpacing: 0.5, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ✕ RESET
        </button>
      )}

      {/* View Toggle */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, borderRadius: 6, overflow: 'hidden', border: '1px solid #142014' }}>
        {[
          { k: 'bubbles', l: '◉ MAP' },
          { k: 'leaderboard', l: '⊞ TABLE' },
        ].map(v => (
          <button
            key={v.k}
            onClick={() => onView(v.k)}
            style={{
              background: view === v.k ? '#142014' : 'transparent',
              border: 'none', padding: '4px 14px', cursor: 'pointer',
              color: view === v.k ? '#4ADE80' : '#888', fontSize: 11,
              fontWeight: 700, fontFamily: 'inherit', letterSpacing: 0.5,
              borderRight: '1px solid #142014',
            }}
          >
            {v.l}
          </button>
        ))}
      </div>
    </div>
  );
}
