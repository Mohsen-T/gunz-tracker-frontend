import { useState, useEffect } from 'react';
import { RARITY_CONFIG, RARITY_ORDER, NODE_IMAGE_URL } from '../utils/constants';
import { formatNum, shortenAddr, timeAgo } from '../utils/format';
import { fetchWallet, fetchMarketplaceListings, fetchWalletMarketplace } from '../services/api';

/**
 * User profile page (OpenSea-style).
 * Shows collection, active listings, offers made, and activity.
 */
const TAB_MAP = {
  profile: 'collected', collected: 'collected',
  listings: 'listed', listed: 'listed',
  offers: 'offers',
  favorites: 'favorites',
  settings: 'settings',
  activity: 'activity',
};

export default function ProfilePage({ wallet, onClose, onSelectNode, isMobile, initialTab }) {
  const [tab, setTab] = useState(TAB_MAP[initialTab] || 'collected');
  const [nodes, setNodes] = useState([]);
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [mpStats, setMpStats] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet?.address) return;
    Promise.all([
      fetchWallet(wallet.address).catch(() => ({ nodes: [] })),
      fetchWalletMarketplace(wallet.address).catch(() => ({})),
    ]).then(([wData, mData]) => {
      setWalletData(wData);
      setNodes(wData.nodes || []);
      setListings(mData.activeListings || []);
      setOffers(mData.activeOffers || []);
      setSalesHistory(mData.salesHistory || []);
      setMpStats(mData.stats || null);
      setLoading(false);
    });
  }, [wallet?.address]);

  const totalHP = walletData?.totalHashpower || 0;
  const totalHexes = walletData?.totalHexes || 0;
  const activeCount = walletData?.activeCount || 0;

  // Rarity breakdown
  const rarities = walletData?.rarities || {};

  const tabs = [
    { id: 'collected', label: 'Collected', count: nodes.length },
    { id: 'listed', label: 'Listed', count: listings.length },
    { id: 'offers', label: 'Offers', count: offers.length },
    { id: 'favorites', label: 'Favorites', count: null },
    { id: 'activity', label: 'Activity', count: salesHistory.length || null },
    { id: 'settings', label: 'Settings', count: null },
  ];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Profile banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a180a, #060b06)',
        padding: isMobile ? '16px' : '20px 32px',
        borderBottom: '1px solid #142014',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 16, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {/* Avatar */}
          <div style={{
            width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#000',
            border: '3px solid #142014',
          }}>
            {wallet?.address ? wallet.address.slice(2, 4).toUpperCase() : '??'}
          </div>

          {/* Name + connected */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#ddd', marginBottom: 2 }}>
              {shortenAddr(wallet?.address)}
            </div>
            <div style={{ fontSize: 9, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
              Connected via {wallet?.provider || 'wallet'}
            </div>
          </div>

          {/* Stats — aligned right on desktop, below on mobile */}
          <div style={{
            display: 'flex', gap: isMobile ? 10 : 20, flexWrap: 'wrap',
            marginLeft: isMobile ? 0 : 'auto', alignItems: 'center',
            ...(isMobile ? { width: '100%', marginTop: 8 } : {}),
          }}>
            {[
              { l: 'NODES', v: nodes.length, c: '#4ADE80' },
              { l: 'LISTED', v: listings.length, c: '#60A5FA' },
              { l: 'HP', v: formatNum(totalHP), c: '#FBBF24' },
              { l: 'HEXES', v: formatNum(totalHexes), c: '#C084FC' },
              { l: 'ACTIVE', v: activeCount, c: '#4ADE80' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: '#556', letterSpacing: 1, marginBottom: 1 }}>{s.l}</div>
                <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
            {/* Rarity badges inline */}
            {RARITY_ORDER.filter(r => rarities[r]).map(r => (
              <span key={r} style={{
                background: RARITY_CONFIG[r].color + '15', border: `1px solid ${RARITY_CONFIG[r].color}33`,
                borderRadius: 4, padding: '2px 6px', fontSize: 8, fontWeight: 700,
                color: RARITY_CONFIG[r].color,
              }}>
                {rarities[r]} {r}
              </span>
            ))}
          </div>

          {/* Back button */}
          <button onClick={onClose} style={{
            flexShrink: 0, background: '#0a140a', border: '1px solid #1a2a1a',
            borderRadius: 8, color: '#556', padding: '6px 14px', fontSize: 10,
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, letterSpacing: 1,
            ...(isMobile ? { position: 'absolute', top: 16, right: 16 } : {}),
          }}>BACK</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #142014', flexShrink: 0, background: '#060b06' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid #4ADE80' : '2px solid transparent',
            color: tab === t.id ? '#4ADE80' : '#556',
            padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
          }}>
            {t.label}{t.count != null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 12 : 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#445', fontSize: 11, animation: 'pulse 1.5s infinite' }}>
            Loading...
          </div>
        ) : tab === 'collected' ? (
          <CollectedGrid nodes={nodes} isMobile={isMobile} onSelect={onSelectNode} />
        ) : tab === 'listed' ? (
          <ListedGrid listings={listings} isMobile={isMobile} />
        ) : tab === 'offers' ? (
          <OffersTab offers={offers} wallet={wallet} />
        ) : tab === 'favorites' ? (
          <FavoritesTab />
        ) : tab === 'settings' ? (
          <SettingsTab wallet={wallet} />
        ) : (
          <ActivityTab salesHistory={salesHistory} wallet={wallet} mpStats={mpStats} />
        )}
      </div>
    </div>
  );
}

function CollectedGrid({ nodes, isMobile, onSelect }) {
  if (nodes.length === 0) {
    return <EmptyState text="No NFTs in this wallet" />;
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: isMobile ? 8 : 10,
    }}>
      {nodes.map(node => {
        const rc = RARITY_CONFIG[node.rarity]?.color || '#778';
        return (
          <div key={node.id} onClick={() => onSelect?.(node)} style={{
            background: '#0a140a', borderRadius: 10, overflow: 'hidden',
            border: '1px solid #142014', cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = rc + '44'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#142014'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ position: 'relative', paddingTop: '100%', background: '#060b06' }}>
              <img src={NODE_IMAGE_URL(node.id)} alt={`#${node.id}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', top: 4, left: 4, background: rc + '22',
                border: `1px solid ${rc}44`, borderRadius: 4, padding: '1px 5px',
                fontSize: 7, fontWeight: 800, color: rc, letterSpacing: 1,
              }}>{node.rarity?.toUpperCase()}</div>
              <div style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: node.activity === 'Active' ? '#4ADE80' : '#EF4444',
              }} />
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ddd' }}>#{node.id}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 8, color: '#556' }}>HP {formatNum(node.hashpower)}</span>
                <span style={{ fontSize: 8, color: '#556' }}>HEX {formatNum(node.hexesDecoded)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListedGrid({ listings, isMobile }) {
  if (listings.length === 0) {
    return <EmptyState text="No active listings" />;
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: isMobile ? 8 : 10,
    }}>
      {listings.map(l => {
        const rc = RARITY_CONFIG[l.rarity]?.color || '#778';
        return (
          <div key={l.listingId} style={{
            background: '#0a140a', borderRadius: 10, overflow: 'hidden',
            border: '1px solid #142014',
          }}>
            <div style={{ position: 'relative', paddingTop: '80%', background: '#060b06' }}>
              <img src={NODE_IMAGE_URL(l.tokenId)} alt={`#${l.tokenId}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', top: 4, left: 4, background: '#4ADE8022',
                border: '1px solid #4ADE8044', borderRadius: 4, padding: '1px 5px',
                fontSize: 7, fontWeight: 800, color: '#4ADE80', letterSpacing: 1,
              }}>LISTED</div>
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', marginBottom: 2 }}>#{l.tokenId}</div>
              <div style={{ fontSize: 9, color: rc, marginBottom: 4 }}>{l.rarity}</div>
              <div style={{
                background: '#060b06', borderRadius: 6, padding: '4px 6px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 8, color: '#556' }}>PRICE</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4ADE80' }}>
                  {Number(l.price).toFixed(1)} GUN
                </span>
              </div>
              <div style={{ fontSize: 8, color: '#334', marginTop: 4 }}>Listed {timeAgo(l.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OffersTab({ offers, wallet }) {
  if (offers.length === 0) return <EmptyState text="No active offers" />;
  return (
    <div style={{ maxWidth: 600 }}>
      {offers.map((o, i) => {
        const rc = RARITY_CONFIG[o.rarity]?.color || '#778';
        const expired = o.expiresAt && new Date(o.expiresAt) < new Date();
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: '1px solid #0d180d',
            opacity: expired ? 0.5 : 1,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', minWidth: 60 }}>#{o.tokenId}</div>
            <span style={{ fontSize: 9, color: rc }}>{o.rarity}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{Number(o.amount).toFixed(2)} GUN</span>
            <span style={{ fontSize: 9, color: expired ? '#EF4444' : '#334', minWidth: 60, textAlign: 'right' }}>
              {expired ? 'EXPIRED' : timeAgo(o.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityTab({ salesHistory, wallet, mpStats }) {
  if (!salesHistory || salesHistory.length === 0) {
    return (
      <div>
        {mpStats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>SOLD</div><div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{mpStats.totalSold}</div></div>
            <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>SOLD VOL</div><div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{formatNum(mpStats.soldVolume)} GUN</div></div>
            <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>BOUGHT</div><div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{mpStats.totalBought}</div></div>
            <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>BOUGHT VOL</div><div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{formatNum(mpStats.boughtVolume)} GUN</div></div>
          </div>
        )}
        <EmptyState text="No marketplace activity yet" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {mpStats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>SOLD</div><div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{mpStats.totalSold}</div></div>
          <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>SOLD VOL</div><div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{formatNum(mpStats.soldVolume)} GUN</div></div>
          <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>BOUGHT</div><div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{mpStats.totalBought}</div></div>
          <div><div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>BOUGHT VOL</div><div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>{formatNum(mpStats.boughtVolume)} GUN</div></div>
        </div>
      )}
      {salesHistory.map((s, i) => {
        const isSeller = wallet?.address?.toLowerCase() === s.seller?.toLowerCase();
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #0d180d' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSeller ? '#4ADE80' : '#60A5FA', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>{isSeller ? 'Sold' : 'Bought'} Node #{s.tokenId}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: isSeller ? '#4ADE80' : '#60A5FA' }}>{Number(s.price).toFixed(2)} GUN</span>
            <span style={{ fontSize: 9, color: '#334' }}>{timeAgo(s.soldAt)}</span>
          </div>
        );
      })}
    </div>
  );
}

function FavoritesTab() {
  return <EmptyState text="No favorites yet. Browse the marketplace and save items you like." />;
}

function SettingsTab({ wallet }) {
  return (
    <div style={{ maxWidth: 500 }}>
      {/* Notifications settings */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ddd', marginBottom: 12 }}>Notification Preferences</div>
        {[
          { label: 'Item Sold', desc: 'When one of your listed items sells', default: true },
          { label: 'New Offers', desc: 'When someone makes an offer on your listing', default: true },
          { label: 'Offer Accepted', desc: 'When your offer is accepted', default: true },
          { label: 'Offer Expired', desc: 'When your offer expires', default: false },
          { label: 'Price Drops', desc: 'When a watched item drops in price', default: false },
        ].map((s, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0d180d', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: '#445' }}>{s.desc}</div>
            </div>
            <input type="checkbox" defaultChecked={s.default} style={{ accentColor: '#4ADE80', width: 16, height: 16 }} />
          </label>
        ))}
      </div>

      {/* Account info */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ddd', marginBottom: 12 }}>Account</div>
        <div style={{ background: '#0a140a', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: '#445', letterSpacing: 1, marginBottom: 2 }}>WALLET ADDRESS</div>
            <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{wallet?.address}</div>
          </div>
          <button onClick={() => navigator.clipboard?.writeText(wallet?.address)} style={{ background: '#0d180d', border: '1px solid #1a2a1a', borderRadius: 4, color: '#4ADE80', padding: '4px 10px', fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>COPY</button>
        </div>
        <div style={{ background: '#0a140a', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: '#445', letterSpacing: 1, marginBottom: 2 }}>CONNECTED VIA</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{wallet?.provider || 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 12 }}>Danger Zone</div>
        <button onClick={() => wallet?.disconnect()} style={{
          background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 8,
          color: '#EF4444', padding: '10px 20px', fontSize: 11, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
        }}>DISCONNECT WALLET</button>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#445' }}>
      <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }}>Empty</div>
      <div style={{ fontSize: 11 }}>{text}</div>
    </div>
  );
}
