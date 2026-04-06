import { useState, useRef, useEffect } from 'react';
import { shortenAddr } from '../utils/format';

/**
 * Account dropdown menu (OpenSea-style).
 * Shows profile, settings, manage wallet, disconnect.
 */
export default function AccountMenu({ wallet, onClose, onNavigate, isMobile }) {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: '◉', desc: 'View your collection & activity' },
    { id: 'listings', label: 'My Listings', icon: '▤', desc: 'Manage your active listings' },
    { id: 'offers', label: 'My Offers', icon: '◈', desc: 'View offers you\'ve made' },
    { id: 'favorites', label: 'Favorites', icon: '♡', desc: 'Saved items' },
    { divider: true },
    { id: 'settings', label: 'Settings', icon: '⚙', desc: 'Notifications & preferences' },
    { id: 'manage-wallet', label: 'Manage Wallet', icon: '⬡', desc: shortenAddr(wallet?.address) },
    { divider: true },
    { id: 'disconnect', label: 'Log Out', icon: '⏻', desc: 'Disconnect wallet', danger: true },
  ];

  const handleClick = (item) => {
    if (item.id === 'disconnect') {
      wallet?.disconnect();
      onClose();
    } else if (item.id === 'profile') {
      onNavigate?.('profile');
      onClose();
    } else if (item.id === 'settings') {
      onNavigate?.('settings');
      onClose();
    } else {
      onNavigate?.(item.id);
      onClose();
    }
  };

  return (
    <div ref={menuRef} style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 190,
      background: '#080f08', border: '1px solid #142014', borderRadius: 12,
      width: isMobile ? 260 : 280, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'fadeInDown 0.15s ease-out',
    }}>
      {/* Account header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #0d180d',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#000',
        }}>
          {wallet?.address ? wallet.address.slice(2, 4).toUpperCase() : '??'}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>{shortenAddr(wallet?.address)}</div>
          <div style={{ fontSize: 9, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            Connected
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '6px 0' }}>
        {menuItems.map((item, i) => {
          if (item.divider) {
            return <div key={i} style={{ height: 1, background: '#0d180d', margin: '4px 0' }} />;
          }
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', background: 'transparent', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0c180c'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: 16, width: 24, textAlign: 'center',
                color: item.danger ? '#EF4444' : '#667',
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.danger ? '#EF4444' : '#ddd' }}>{item.label}</div>
                {item.desc && (
                  <div style={{ fontSize: 9, color: '#445', marginTop: 1 }}>{item.desc}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
