import { useState, useEffect } from 'react';
import { shortenAddr, timeAgo } from '../utils/format';
import { RARITY_CONFIG } from '../utils/constants';
import { fetchNotifications, markNotificationsRead } from '../services/api';

/**
 * Notification dropdown panel wired to backend API.
 */
export default function NotificationPanel({ onClose, isMobile, wallet }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet?.address) { setLoading(false); return; }
    fetchNotifications(wallet.address)
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wallet?.address]);

  const filtered = tab === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  const markAllRead = async () => {
    if (!wallet?.address) return;
    try {
      await markNotificationsRead(wallet.address);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markOneRead = async (id) => {
    if (!wallet?.address) return;
    try {
      await markNotificationsRead(wallet.address, [id]);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const typeConfig = {
    listing: { icon: '+', color: '#60A5FA' },
    sale: { icon: '$', color: '#4ADE80' },
    purchase: { icon: '$', color: '#4ADE80' },
    offer: { icon: '◈', color: '#60A5FA' },
    offer_accepted: { icon: '✓', color: '#4ADE80' },
    offer_expired: { icon: '⏱', color: '#EF4444' },
  };

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 190,
      background: '#080f08', border: '1px solid #142014', borderRadius: 12,
      width: isMobile ? 300 : 360, maxHeight: 480, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'fadeInDown 0.15s ease-out',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #142014' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>Notifications</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#4ADE80', fontSize: 9, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Mark all read</button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#445', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>x</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #0d180d' }}>
        {['all', 'unread'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid #4ADE80' : '2px solid transparent',
            color: tab === t ? '#4ADE80' : '#556',
            padding: '8px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            {t}{t === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#445', fontSize: 11, animation: 'pulse 1.5s infinite' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#445', fontSize: 11 }}>
            {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          filtered.map(n => {
            const cfg = typeConfig[n.type] || { icon: '•', color: '#556' };
            return (
              <div key={n.id} onClick={() => !n.isRead && markOneRead(n.id)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', borderBottom: '1px solid #0a140a',
                background: n.isRead ? 'transparent' : '#0a180a08',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#0c180c'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : '#0a180a08'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: cfg.color + '15', border: `1px solid ${cfg.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: cfg.color,
                }}>{cfg.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ddd', marginBottom: 2 }}>{n.message}</div>
                  {n.txHash && (
                    <a href={`https://gunzscan.io/tx/${n.txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 8, color: '#4ADE8088', textDecoration: 'none' }}>View TX &#8599;</a>
                  )}
                  <div style={{ fontSize: 8, color: '#334', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0, marginTop: 4 }} />}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
