import { formatNum, shortenAddr } from '../utils/format';
import AccountMenu from './AccountMenu';
import NotificationPanel from './NotificationPanel';

export default function Header({
  filteredCount, stats, lastUpdated, isMobile, onNavigate, currentPage,
  wallet, onConnectWallet,
  // Overlay control — lifted to App.jsx so only one is open at a time
  activeOverlay, onSetOverlay,
}) {
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
  const isMarketplace = currentPage === 'marketplace';

  if (isMobile) {
    return (
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #142014', background: '#060b06', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMarketplace ? 0 : 6 }}>
          <img src="/logo.png" alt="GRIDZILLA" style={{ height: 36 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {navItems.map(nav => <NavButton key={nav.id} nav={nav} currentPage={currentPage} onNavigate={onNavigate} isMobile />)}
            <span style={{ fontSize: 9, color: '#778', padding: '1px 5px', border: '1px solid #1a2a1a', borderRadius: 4 }}>BETA</span>
            {isMarketplace && (wallet?.isConnected
              ? <ConnectedBar wallet={wallet} isMobile activeOverlay={activeOverlay} onSetOverlay={onSetOverlay} />
              : <ConnectButton onClick={onConnectWallet} isMobile />
            )}
          </div>
        </div>
        {!isMarketplace && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {statItems.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 8, letterSpacing: 1, color: '#778' }}>{s.l}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px', borderBottom: '1px solid #142014', background: '#060b06', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo.png" alt="GRIDZILLA" style={{ height: 70 }} />
        <span style={{ fontSize: 11, color: '#778', padding: '2px 6px', border: '1px solid #1a2a1a', borderRadius: 4 }}>BETA</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {navItems.map(nav => <NavButton key={nav.id} nav={nav} currentPage={currentPage} onNavigate={onNavigate} />)}
        </div>
      </div>
      {isMarketplace ? (wallet?.isConnected
        ? <ConnectedBar wallet={wallet} activeOverlay={activeOverlay} onSetOverlay={onSetOverlay} />
        : <ConnectButton onClick={onConnectWallet} />
      ) : (
        <div style={{ display: 'flex', gap: 28 }}>
          {statItems.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#778', marginBottom: 2 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavButton({ nav, currentPage, onNavigate, isMobile }) {
  const active = currentPage === nav.id;
  return (
    <button onClick={() => onNavigate?.(nav.id)} style={{
      background: active ? '#4ADE8018' : 'transparent',
      border: `1px solid ${active ? '#4ADE8044' : '#1a2a1a'}`,
      borderRadius: isMobile ? 4 : 6, padding: isMobile ? '2px 6px' : '5px 14px',
      cursor: 'pointer', color: active ? '#4ADE80' : '#667',
      fontSize: isMobile ? 8 : 11, fontWeight: 700, fontFamily: 'inherit',
      letterSpacing: isMobile ? 1 : 2, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#2a3a2a'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#667'; e.currentTarget.style.borderColor = '#1a2a1a'; } }}
    >{nav.label}</button>
  );
}

function ConnectButton({ onClick, isMobile }) {
  return (
    <button onClick={onClick} style={{
      background: 'linear-gradient(135deg, #4ADE80, #22c55e)', color: '#000', border: 'none',
      borderRadius: isMobile ? 6 : 8, padding: isMobile ? '4px 10px' : '8px 22px',
      fontSize: isMobile ? 9 : 12, fontWeight: 800, fontFamily: 'inherit', letterSpacing: 2,
      cursor: 'pointer', boxShadow: '0 0 20px #4ADE8022', transition: 'transform 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >CONNECT WALLET</button>
  );
}

/**
 * Connected wallet bar: [bell] [wallet] [balance] [avatar▼]
 * All overlays controlled by activeOverlay prop from App.jsx.
 */
function ConnectedBar({ wallet, isMobile, activeOverlay, onSetOverlay }) {
  const toggle = (name) => {
    // Close current if same, otherwise close all and open new
    onSetOverlay(activeOverlay === name ? null : name);
  };

  const unread = wallet.unreadNotifications || 0;
  const balText = wallet.balance != null ? `${wallet.balance.toFixed(1)} GUN` : '— GUN';

  const iconBtn = (children, onClick, title, isActive) => (
    <button onClick={onClick} title={title} style={{
      background: isActive ? '#0c180c' : '#0a140a',
      border: `1px solid ${isActive ? '#4ADE8044' : '#1a2a1a'}`, borderRadius: 8,
      width: isMobile ? 28 : 36, height: isMobile ? 28 : 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s',
      position: 'relative',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a3a2a'}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#1a2a1a'; }}
    >{children}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
      {/* Notification bell */}
      <div style={{ position: 'relative' }}>
        {iconBtn(
          <>
            <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="#778" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <div style={{
                position: 'absolute', top: isMobile ? 1 : 3, right: isMobile ? 1 : 3,
                minWidth: 14, height: 14, borderRadius: 7, padding: '0 3px',
                background: '#EF4444', border: '1.5px solid #060b06',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: '#fff',
              }}>{unread > 9 ? '9+' : unread}</div>
            )}
          </>,
          () => toggle('notifications'),
          'Notifications',
          activeOverlay === 'notifications'
        )}
        {activeOverlay === 'notifications' && (
          <NotificationPanel
            onClose={() => onSetOverlay(null)}
            isMobile={isMobile}
            wallet={wallet}
          />
        )}
      </div>

      {/* Wallet icon */}
      {iconBtn(
        <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>,
        () => toggle('walletPanel'),
        'Wallet',
        activeOverlay === 'walletPanel'
      )}

      {/* GUN balance chip (desktop) */}
      {!isMobile && (
        <button onClick={() => toggle('walletPanel')} style={{
          background: '#0a180a', border: `1px solid ${activeOverlay === 'walletPanel' ? '#4ADE8066' : '#4ADE8033'}`,
          borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#4ADE8066'}
          onMouseLeave={e => { if (activeOverlay !== 'walletPanel') e.currentTarget.style.borderColor = '#4ADE8033'; }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>{balText}</span>
        </button>
      )}

      {/* Account avatar + dropdown */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => toggle('accountMenu')} style={{
          background: '#0a140a', border: `1px solid ${activeOverlay === 'accountMenu' ? '#4ADE8044' : '#1a2a1a'}`,
          borderRadius: 8, padding: isMobile ? '2px 4px' : '3px 6px',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'border-color 0.15s',
        }}>
          <div style={{
            width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 9 : 11, fontWeight: 800, color: '#000',
          }}>{wallet?.address ? wallet.address.slice(2, 4).toUpperCase() : '??'}</div>
          <div style={{ position: 'absolute', bottom: isMobile ? 0 : 1, right: isMobile ? 2 : 4, width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', border: '1.5px solid #060b06' }} />
          {!isMobile && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 4 L5 7 L8 4" stroke="#556" strokeWidth="1.5" fill="none" /></svg>}
        </button>
        {activeOverlay === 'accountMenu' && (
          <AccountMenu
            wallet={wallet}
            onClose={() => onSetOverlay(null)}
            onNavigate={(target) => onSetOverlay(target)}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
