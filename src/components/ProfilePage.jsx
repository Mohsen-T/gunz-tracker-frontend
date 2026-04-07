import { useState, useEffect, useCallback } from 'react';
import { RARITY_CONFIG, RARITY_ORDER, NODE_IMAGE_URL, GUNZ_LICENSE_CONTRACT } from '../utils/constants';
import { formatNum, shortenAddr, timeAgo } from '../utils/format';
import { fetchWallet, fetchWalletMarketplace, fetchTokenMarketplace } from '../services/api';
import ListingDetail from './ListingDetail';
import CreateListing from './CreateListing';

/**
 * User profile page (OpenSea-style).
 * Shows collection, active listings, offers made, and activity.
 */
const TAB_MAP = {
  profile: 'collected',
  collected: 'collected',
  listings: 'listed',
  listed: 'listed',
  offers: 'offers',
  favorites: 'favorites',
  activity: 'activity',
  settings: 'settings',
};

export default function ProfilePage({ wallet, onClose, onSelectNode, isMobile, initialTab }) {
  const [tab, setTab] = useState(TAB_MAP[initialTab] || 'collected');

  useEffect(() => {
    const mapped = TAB_MAP[initialTab];
    if (mapped) setTab(mapped);
  }, [initialTab]);

  const [nodes, setNodes] = useState([]);
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);          // offers I made
  const [receivedOffers, setReceivedOffers] = useState([]); // offers others made on me
  const [salesHistory, setSalesHistory] = useState([]);
  const [mpStats, setMpStats] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals — for opening listing detail and create-listing flow
  const [openListing, setOpenListing] = useState(null);   // listing object to view in ListingDetail
  const [showCreateListing, setShowCreateListing] = useState(false);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Refetch data on mount, tab change, and after every refresh trigger
  useEffect(() => {
    if (!wallet?.address) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWallet(wallet.address).catch(() => ({ nodes: [] })),
      fetchWalletMarketplace(wallet.address).catch(() => ({})),
    ]).then(([wData, mData]) => {
      if (cancelled) return;
      setWalletData(wData);

      // Merge tracker-derived nodes with marketplace-acquired NFTs.
      // Local Hardhat transfers won't show in the tracker DB, so we add NFTs
      // the user purchased via the marketplace (and haven't re-sold).
      const trackerNodes = wData.nodes || [];
      const ownedFromMp = mData.ownedNfts || [];
      // Marketplace-acquired NFTs WIN on tokenId collision (actual on-chain ownership)
      const mpIds = new Set(ownedFromMp.map(o => String(o.id)));
      const merged = [];
      for (const o of ownedFromMp) {
        merged.push({
          id: o.id,
          rarity: o.rarity || 'Common',
          hashpower: o.hashpower || 0,
          hexesDecoded: o.hexesDecoded || 0,
          activity: o.activity || 'Active',
          nftContract: o.nftContract || GUNZ_LICENSE_CONTRACT,
          _fromMarketplace: true,
        });
      }
      for (const n of trackerNodes) {
        if (!mpIds.has(String(n.id))) {
          merged.push({ ...n, nftContract: GUNZ_LICENSE_CONTRACT });
        }
      }
      setNodes(merged);
      setListings(mData.activeListings || []);
      setOffers(mData.activeOffers || []);
      setReceivedOffers(mData.receivedOffers || []);
      setSalesHistory(mData.salesHistory || []);
      setMpStats(mData.stats || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [wallet?.address, tab, refreshKey]);

  // Open the listing detail for a token: looks up its active listing if any, else opens an "info-only" view
  const handleOpenNode = useCallback(async (tokenIdOrListing) => {
    // If it's already a listing object (has listingId), open directly
    if (tokenIdOrListing?.listingId) {
      setOpenListing(tokenIdOrListing);
      return;
    }
    // Otherwise it's a node — try to find an active listing for it
    const node = tokenIdOrListing;
    try {
      const data = await fetchTokenMarketplace(GUNZ_LICENSE_CONTRACT, node.id);
      if (data?.activeListing) {
        setOpenListing({
          listingId: data.activeListing.listingId,
          tokenId: node.id,
          rarity: node.rarity,
          price: data.activeListing.price,
          seller: data.activeListing.seller,
          status: 'Active',
          createdAt: data.activeListing.createdAt,
          hashpower: node.hashpower,
          hexesDecoded: node.hexesDecoded,
        });
      } else {
        // No active listing — fall through to node detail (tracker)
        onSelectNode?.(node);
      }
    } catch {
      onSelectNode?.(node);
    }
  }, [onSelectNode]);

  const handleCloseListing = useCallback(() => {
    setOpenListing(null);
    refresh(); // refetch after any action taken in the modal
  }, [refresh]);

  const handleCloseCreate = useCallback(() => {
    setShowCreateListing(false);
    refresh();
  }, [refresh]);

  const totalHP = walletData?.totalHashpower || 0;
  const totalHexes = walletData?.totalHexes || 0;
  const activeCount = walletData?.activeCount || 0;

  // Rarity breakdown
  const rarities = walletData?.rarities || {};

  const tabs = [
    { id: 'collected', label: 'Collected', count: nodes.length },
    { id: 'listed', label: 'Listed', count: listings.length },
    { id: 'offers', label: 'Offers', count: (offers.length + receivedOffers.length) || null },
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
          <CollectedGrid
            nodes={nodes}
            listings={listings}
            isMobile={isMobile}
            onOpen={handleOpenNode}
            onListForSale={() => setShowCreateListing(true)}
          />
        ) : tab === 'listed' ? (
          <ListedGrid listings={listings} isMobile={isMobile} onOpen={handleOpenNode} />
        ) : tab === 'offers' ? (
          <OffersTab offers={offers} receivedOffers={receivedOffers} wallet={wallet} onOpen={handleOpenNode} />
        ) : tab === 'favorites' ? (
          <FavoritesTab />
        ) : tab === 'settings' ? (
          <SettingsTab wallet={wallet} />
        ) : (
          <ActivityTab salesHistory={salesHistory} wallet={wallet} mpStats={mpStats} onOpen={handleOpenNode} />
        )}
      </div>

      {/* Listing Detail modal — works for buy/offer/cancel/accept/withdraw */}
      {openListing && (
        <ListingDetail
          listing={openListing}
          onClose={handleCloseListing}
          onSelectNode={onSelectNode}
          isMobile={isMobile}
          wallet={wallet}
        />
      )}

      {/* Create Listing modal */}
      {showCreateListing && wallet?.isConnected && (
        <CreateListing
          onClose={handleCloseCreate}
          isMobile={isMobile}
          walletAddress={wallet.address}
        />
      )}
    </div>
  );
}

function CollectedGrid({ nodes, listings, isMobile, onOpen, onListForSale }) {
  if (nodes.length === 0) {
    return <EmptyState text="No NFTs in this wallet" />;
  }

  // Build a set of token IDs that are currently listed for the LISTED badge
  const listedIds = new Set(listings.map(l => String(l.tokenId)));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#778' }}>{nodes.length} NFT{nodes.length !== 1 ? 's' : ''} in wallet</div>
        <button onClick={onListForSale} style={{
          background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
          color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px',
          fontSize: 10, fontWeight: 800, fontFamily: 'inherit', letterSpacing: 1, cursor: 'pointer',
        }}>+ LIST FOR SALE</button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: isMobile ? 8 : 10,
      }}>
        {nodes.map(node => {
          const rc = RARITY_CONFIG[node.rarity]?.color || '#778';
          const isListed = listedIds.has(String(node.id));
          return (
            <div key={node.id} onClick={() => onOpen?.(node)} style={{
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
                {isListed && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4, background: '#4ADE8022',
                    border: '1px solid #4ADE8044', borderRadius: 4, padding: '1px 5px',
                    fontSize: 7, fontWeight: 800, color: '#4ADE80', letterSpacing: 1,
                  }}>LISTED</div>
                )}
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
    </div>
  );
}

function ListedGrid({ listings, isMobile, onOpen }) {
  if (listings.length === 0) {
    return <EmptyState text="No active listings. List one of your NFTs from the Collected tab." />;
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
          <div key={l.listingId} onClick={() => onOpen?.(l)} style={{
            background: '#0a140a', borderRadius: 10, overflow: 'hidden',
            border: '1px solid #142014', cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = rc + '44'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#142014'; e.currentTarget.style.transform = 'none'; }}
          >
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

function OffersTab({ offers, receivedOffers, wallet, onOpen }) {
  // Default to Received if there are any (since those need action), otherwise Made
  const [subTab, setSubTab] = useState(receivedOffers.length > 0 ? 'received' : 'made');

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Subtabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #0d180d' }}>
        {[
          { id: 'received', label: 'Received', count: receivedOffers.length, hint: 'Offers on your listings' },
          { id: 'made', label: 'Made', count: offers.length, hint: 'Offers you made' },
        ].map(s => (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            background: 'none', border: 'none',
            borderBottom: subTab === s.id ? '2px solid #4ADE80' : '2px solid transparent',
            color: subTab === s.id ? '#4ADE80' : '#556',
            padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
          }}>
            {s.label.toUpperCase()}{s.count > 0 ? ` (${s.count})` : ''}
          </button>
        ))}
      </div>

      {subTab === 'received' ? (
        receivedOffers.length === 0 ? (
          <EmptyState text="No offers received. List an NFT to start receiving offers." />
        ) : (
          receivedOffers.map((o, i) => {
            const rc = RARITY_CONFIG[o.rarity]?.color || '#778';
            const expired = o.expiresAt && new Date(o.expiresAt) < new Date();
            const listingPrice = Number(o.listingPrice) || 0;
            const offerPct = listingPrice > 0 ? Math.round((Number(o.amount) / listingPrice) * 100) : 0;
            return (
              <div key={i}
                onClick={() => onOpen?.({ listingId: o.listingId, tokenId: o.tokenId, rarity: o.rarity, status: 'Active' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', marginBottom: 6,
                  background: '#0a140a', border: `1px solid ${expired ? '#142014' : '#4ADE8033'}`, borderRadius: 8,
                  opacity: expired ? 0.5 : 1, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4ADE8088'}
                onMouseLeave={e => e.currentTarget.style.borderColor = expired ? '#142014' : '#4ADE8033'}
              >
                <img src={NODE_IMAGE_URL(o.tokenId)} alt={`#${o.tokenId}`}
                  style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: '#060b06' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>#{o.tokenId}</div>
                  <span style={{ fontSize: 9, color: rc }}>{o.rarity}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#445', letterSpacing: 1 }}>FROM</div>
                  <div style={{ fontSize: 9, color: '#778' }}>{shortenAddr(o.bidder)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: '#445' }}>OFFER</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#4ADE80' }}>{Number(o.amount).toFixed(2)} GUN</div>
                  {listingPrice > 0 && (
                    <div style={{ fontSize: 8, color: offerPct >= 90 ? '#4ADE80' : offerPct >= 70 ? '#FBBF24' : '#EF4444' }}>
                      {offerPct}% of listing
                    </div>
                  )}
                </div>
                <button style={{
                  background: '#4ADE8022', border: '1px solid #4ADE8055', borderRadius: 6,
                  color: '#4ADE80', padding: '6px 12px', fontSize: 10, fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                }}>VIEW</button>
              </div>
            );
          })
        )
      ) : (
        offers.length === 0 ? (
          <EmptyState text="No active offers. Browse the marketplace to make one." />
        ) : (
          offers.map((o, i) => {
            const rc = RARITY_CONFIG[o.rarity]?.color || '#778';
            const expired = o.expiresAt && new Date(o.expiresAt) < new Date();
            return (
              <div key={i}
                onClick={() => onOpen?.({ listingId: o.listingId, tokenId: o.tokenId, rarity: o.rarity, status: 'Active' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', marginBottom: 6,
                  background: '#0a140a', border: '1px solid #142014', borderRadius: 8,
                  opacity: expired ? 0.5 : 1, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#60A5FA44'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#142014'}
              >
                <img src={NODE_IMAGE_URL(o.tokenId)} alt={`#${o.tokenId}`}
                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#060b06' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>#{o.tokenId}</div>
                  <span style={{ fontSize: 9, color: rc }}>{o.rarity}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: '#445' }}>YOUR OFFER</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA' }}>{Number(o.amount).toFixed(2)} GUN</div>
                </div>
                <span style={{ fontSize: 9, color: expired ? '#EF4444' : '#334', minWidth: 70, textAlign: 'right' }}>
                  {expired ? 'EXPIRED' : `expires ${timeAgo(o.expiresAt)}`}
                </span>
              </div>
            );
          })
        )
      )}
    </div>
  );
}

function ActivityTab({ salesHistory, wallet, mpStats, onOpen }) {
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
        const myAddr = wallet?.address?.toLowerCase() || '';
        const sellerAddr = (s.seller || '').toLowerCase();
        const buyerAddr = (s.buyer || '').toLowerCase();
        // Determine role from BOTH fields, not just seller (defends against missing/null fields)
        const isSeller = myAddr && myAddr === sellerAddr;
        const isBuyer = myAddr && myAddr === buyerAddr;
        const label = isSeller ? 'Sold' : isBuyer ? 'Bought' : 'Trade';
        const color = isSeller ? '#4ADE80' : '#60A5FA';
        return (
          <div key={i}
            onClick={() => onOpen?.({ id: s.tokenId, rarity: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderBottom: '1px solid #0d180d', cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0c180c'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <img src={NODE_IMAGE_URL(s.tokenId)} alt={`#${s.tokenId}`}
              style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', background: '#060b06' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>{label} Node #{s.tokenId}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{Number(s.price).toFixed(2)} GUN</span>
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
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
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
