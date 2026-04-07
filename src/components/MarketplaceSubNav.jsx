/**
 * Secondary navigation strip for marketplace ↔ profile sections.
 * Shows context-aware tabs so users can jump between Browse and their profile
 * sections in one click.
 */
export default function MarketplaceSubNav({
  isMobile,
  wallet,
  currentSection,        // 'browse' | 'collected' | 'listed' | 'offers' | 'activity' | null
  receivedOffersCount = 0,
  madeOffersCount = 0,
  onNavigate,
}) {
  const offersCount = receivedOffersCount + madeOffersCount;

  const items = [
    { id: 'browse', label: 'Browse' },
    ...(wallet?.isConnected ? [
      { id: 'collected', label: 'Collection' },
      { id: 'listed', label: 'My Listings' },
      { id: 'offers', label: 'Offers', badge: offersCount, badgeColor: receivedOffersCount > 0 ? '#4ADE80' : '#60A5FA' },
      { id: 'activity', label: 'Activity' },
    ] : []),
  ];

  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? 4 : 0,
      padding: isMobile ? '0 8px' : '0 20px',
      background: '#060b06',
      borderBottom: '1px solid #142014',
      flexShrink: 0,
      overflowX: 'auto',
    }}>
      {items.map(item => {
        const active = currentSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #4ADE80' : '2px solid transparent',
              color: active ? '#4ADE80' : '#667',
              padding: isMobile ? '8px 10px' : '10px 18px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: isMobile ? 9 : 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#667'; }}
          >
            {item.label}
            {item.badge > 0 && (
              <span style={{
                background: item.badgeColor + '22',
                border: `1px solid ${item.badgeColor}55`,
                color: item.badgeColor,
                borderRadius: 8,
                padding: '1px 6px',
                fontSize: isMobile ? 7 : 9,
                fontWeight: 800,
                lineHeight: 1.4,
              }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
