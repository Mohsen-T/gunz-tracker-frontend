import { useState, useEffect, useRef, useCallback } from 'react';
import { RARITY_CONFIG, RARITY_ORDER, NODE_IMAGE_URL } from '../utils/constants';
import { formatNum, shortenAddr, timeAgo } from '../utils/format';
import {
  fetchMarketplaceListings,
  fetchMarketplaceStats,
  fetchMarketplaceActivity,
} from '../services/api';
import ListingDetail from './ListingDetail';

const SORT_OPTIONS = [
  { value: 'newest', label: 'NEWEST' },
  { value: 'oldest', label: 'OLDEST' },
  { value: 'price_asc', label: 'PRICE: LOW → HIGH' },
  { value: 'price_desc', label: 'PRICE: HIGH → LOW' },
  { value: 'id_asc', label: 'ID: LOW → HIGH' },
  { value: 'id_desc', label: 'ID: HIGH → LOW' },
  { value: 'hp_desc', label: 'HASHPOWER' },
  { value: 'hexes_desc', label: 'HEXES' },
];

// ─── Debounce hook ───
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function MarketplacePage({ onSelectNode, isMobile, wallet, onConnectWallet, onOpenCreateListing }) {
  // Data state
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state (immediate UI)
  const [rarityFilter, setRarityFilter] = useState([]);
  const [sort, setSort] = useState('newest');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [idSearchInput, setIdSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [tab, setTab] = useState('browse');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // When the listing modal closes, refresh marketplace data
  // (in case a buy/offer/cancel/accept happened inside it)
  const handleCloseDetail = useCallback(() => {
    setSelectedListing(null);
    refresh();
  }, [refresh]);

  // Debounced values (only fire API after user stops typing)
  const debouncedIdSearch = useDebounce(idSearchInput, 350);
  const debouncedMinPrice = useDebounce(minPriceInput, 400);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 400);

  const PAGE_SIZE = 24;

  // Build server-side params from all filter state
  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      // Multi-rarity: send comma-separated
      if (rarityFilter.length > 0) {
        params.rarity = rarityFilter.join(',');
      }
      if (debouncedMinPrice) params.minPrice = debouncedMinPrice;
      if (debouncedMaxPrice) params.maxPrice = debouncedMaxPrice;
      if (debouncedIdSearch) params.tokenId = debouncedIdSearch;

      const data = await fetchMarketplaceListings(params);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, [sort, page, rarityFilter, debouncedMinPrice, debouncedMaxPrice, debouncedIdSearch, refreshKey]);

  useEffect(() => { loadListings(); }, [loadListings]);

  // Reset page when any filter changes (debounced values)
  const prevFiltersRef = useRef('');
  useEffect(() => {
    const key = `${rarityFilter.join(',')}-${debouncedMinPrice}-${debouncedMaxPrice}-${debouncedIdSearch}-${sort}`;
    if (prevFiltersRef.current && prevFiltersRef.current !== key) {
      setPage(0);
    }
    prevFiltersRef.current = key;
  }, [rarityFilter, debouncedMinPrice, debouncedMaxPrice, debouncedIdSearch, sort]);

  // Fetch stats + activity on mount AND on every refresh
  useEffect(() => {
    fetchMarketplaceStats().then(setStats).catch(() => {});
    fetchMarketplaceActivity(30).then(setActivity).catch(() => {});
  }, [refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleRarity = (r) => {
    setRarityFilter(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
    setPage(0);
  };

  const resetFilters = () => {
    setRarityFilter([]);
    setSort('newest');
    setMinPriceInput('');
    setMaxPriceInput('');
    setIdSearchInput('');
    setPage(0);
  };

  const hasFilters = rarityFilter.length > 0 || minPriceInput || maxPriceInput || idSearchInput || sort !== 'newest';

  // Active filter count for mobile badge
  const activeFilterCount = rarityFilter.length
    + (minPriceInput ? 1 : 0) + (maxPriceInput ? 1 : 0)
    + (idSearchInput ? 1 : 0) + (sort !== 'newest' ? 1 : 0);

  return (
    <>
      {/* ── Stats Bar ── */}
      <div style={{
        display: 'flex', gap: isMobile ? 6 : 16, padding: isMobile ? '8px 12px' : '8px 20px',
        borderBottom: '1px solid #0d180d', background: '#050a05',
        flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {stats && [
          { l: 'FLOOR', v: stats.floorPrice ? `${stats.floorPrice.toFixed(1)} GUN` : '—', c: '#4ADE80' },
          { l: 'LISTED', v: stats.activeListings?.toLocaleString() || '0', c: '#60A5FA' },
          { l: '24H VOL', v: stats.volume24h ? `${formatNum(stats.volume24h)} GUN` : '—', c: '#FBBF24' },
          { l: '24H SALES', v: stats.sales24h?.toString() || '0', c: '#C084FC' },
          { l: '7D VOL', v: stats.volume7d ? `${formatNum(stats.volume7d)} GUN` : '—', c: '#EF4444' },
          { l: 'ALL-TIME VOL', v: stats.totalVolume ? `${formatNum(stats.totalVolume)} GUN` : '—', c: '#F97316' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: isMobile ? 55 : 70 }}>
            <div style={{ fontSize: isMobile ? 7 : 9, letterSpacing: 1, color: '#556' }}>{s.l}</div>
            <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
        {/* List for Sale button */}
        <button
          onClick={onOpenCreateListing}
          style={{
            marginLeft: isMobile ? 0 : 'auto',
            background: wallet?.isConnected ? '#0a180a' : 'transparent',
            border: `1px solid ${wallet?.isConnected ? '#4ADE8044' : '#1a2a1a'}`,
            borderRadius: 6, padding: isMobile ? '4px 10px' : '6px 16px',
            fontSize: isMobile ? 9 : 11, fontWeight: 700, fontFamily: 'inherit',
            color: wallet?.isConnected ? '#4ADE80' : '#556',
            cursor: 'pointer', letterSpacing: 1, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE8066'; e.currentTarget.style.color = '#4ADE80'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = wallet?.isConnected ? '#4ADE8044' : '#1a2a1a'; e.currentTarget.style.color = wallet?.isConnected ? '#4ADE80' : '#556'; }}
        >
          + LIST FOR SALE
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #142014', flexShrink: 0,
        background: '#060b06',
      }}>
        {['browse', 'activity'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#0a140a' : 'transparent',
            border: 'none', borderBottom: tab === t ? '2px solid #4ADE80' : '2px solid transparent',
            color: tab === t ? '#4ADE80' : '#556',
            padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
          }}>
            {t === 'browse' ? 'BROWSE' : 'ACTIVITY'}
          </button>
        ))}
      </div>

      {tab === 'browse' ? (
        <>
          {/* ── Filters Bar ── */}
          <div style={{
            padding: isMobile ? '8px 10px' : '8px 20px',
            borderBottom: '1px solid #0d180d', background: '#050a05',
            display: 'flex', gap: isMobile ? 5 : 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0,
          }}>
            {/* ID search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={isMobile ? '#ID' : 'Node #ID'}
                value={idSearchInput}
                onChange={e => setIdSearchInput(e.target.value.replace(/\D/g, ''))}
                style={{
                  ...inputStyle,
                  width: isMobile ? 55 : 80,
                  paddingLeft: 6,
                  color: idSearchInput ? '#4ADE80' : '#aaa',
                }}
              />
              {idSearchInput && (
                <button
                  onClick={() => setIdSearchInput('')}
                  style={clearBtnStyle}
                >x</button>
              )}
            </div>

            <Divider />

            {/* Rarity toggles */}
            <div style={{ display: 'flex', gap: isMobile ? 3 : 4, flexWrap: 'wrap' }}>
              {RARITY_ORDER.map(r => {
                const active = rarityFilter.includes(r);
                const cfg = RARITY_CONFIG[r];
                return (
                  <button key={r} onClick={() => toggleRarity(r)} style={{
                    background: active ? cfg.color + '22' : 'transparent',
                    border: `1px solid ${active ? cfg.color : '#1a2a1a'}`,
                    borderRadius: 4, padding: isMobile ? '2px 5px' : '3px 8px', cursor: 'pointer',
                    color: active ? cfg.color : '#556',
                    fontSize: isMobile ? 8 : 10, fontFamily: 'inherit', fontWeight: 700,
                    letterSpacing: 1, transition: 'all 0.15s',
                  }}>
                    {isMobile ? r.slice(0, 3).toUpperCase() : r.toUpperCase()}
                    {stats?.floorByRarity?.[r] && (
                      <span style={{ marginLeft: 3, fontSize: isMobile ? 7 : 8, opacity: 0.6 }}>
                        {stats.floorByRarity[r].count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Divider />

            {/* Price range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 4 }}>
              <input
                type="number" placeholder="Min" value={minPriceInput}
                onChange={e => setMinPriceInput(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? 48 : 65 }}
              />
              <span style={{ color: '#333', fontSize: 9 }}>—</span>
              <input
                type="number" placeholder="Max" value={maxPriceInput}
                onChange={e => setMaxPriceInput(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? 48 : 65 }}
              />
              <span style={{ fontSize: 8, color: '#445', marginLeft: 1 }}>GUN</span>
            </div>

            <Divider />

            {/* Sort dropdown */}
            <select
              value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}
              style={{
                background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 4,
                color: sort !== 'newest' ? '#4ADE80' : '#aaa',
                padding: isMobile ? '2px 4px' : '3px 6px',
                fontSize: isMobile ? 8 : 10, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Reset button */}
            {hasFilters && (
              <button onClick={resetFilters} style={{
                background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 4,
                color: '#EF4444', padding: isMobile ? '2px 6px' : '3px 8px', cursor: 'pointer',
                fontSize: isMobile ? 8 : 10, fontFamily: 'inherit', fontWeight: 700,
                letterSpacing: 1,
              }}>
                RESET{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            )}

            {/* Result count */}
            <span style={{ marginLeft: 'auto', fontSize: isMobile ? 8 : 10, color: '#445' }}>
              {loading ? '...' : `${total} listing${total !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* ── Listings Grid ── */}
          <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 8 : 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#445' }}>
                <div style={{ fontSize: 12, animation: 'pulse 1.5s infinite' }}>Loading listings...</div>
              </div>
            ) : listings.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: isMobile ? 8 : 12,
                }}>
                  {listings.map(listing => (
                    <ListingCard
                      key={listing.listingId}
                      listing={listing}
                      isMobile={isMobile}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                    padding: '16px 0', marginTop: 8,
                  }}>
                    <PaginationBtn
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      label="FIRST"
                    />
                    <PaginationBtn
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      label="PREV"
                    />
                    <span style={{ fontSize: 11, color: '#556', padding: '4px 8px' }}>
                      {page + 1} / {totalPages}
                    </span>
                    <PaginationBtn
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      label="NEXT"
                    />
                    <PaginationBtn
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(totalPages - 1)}
                      label="LAST"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <ActivityFeed activity={activity} isMobile={isMobile} wallet={wallet} />
      )}

      {/* Listing Detail Overlay */}
      {selectedListing && (
        <ListingDetail
          listing={selectedListing}
          onClose={handleCloseDetail}
          onSelectNode={onSelectNode}
          isMobile={isMobile}
          wallet={wallet}
          onConnectWallet={onConnectWallet}
        />
      )}

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </>
  );
}

// ─── Empty State ───

function EmptyState({ hasFilters, onReset }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#445' }}>
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>No listings found</div>
      <div style={{ fontSize: 11, marginBottom: 16 }}>
        {hasFilters ? 'No results match your filters' : 'No active listings yet'}
      </div>
      {hasFilters && (
        <button onClick={onReset} style={{
          background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 6,
          color: '#4ADE80', padding: '8px 20px', cursor: 'pointer',
          fontSize: 11, fontFamily: 'inherit', fontWeight: 700, letterSpacing: 2,
        }}>
          CLEAR FILTERS
        </button>
      )}
    </div>
  );
}

// ─── Listing Card ───

function ListingCard({ listing, isMobile, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const rarityColor = RARITY_CONFIG[listing.rarity]?.color || '#778';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#0c180c' : '#080f08',
        border: `1px solid ${hovered ? rarityColor + '44' : '#142014'}`,
        borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 4px 20px ${rarityColor}15` : 'none',
      }}
    >
      {/* Node Image */}
      <div style={{
        position: 'relative', width: '100%', paddingTop: '100%',
        background: '#060b06',
      }}>
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0a140a', animation: 'pulse 1.5s infinite' }} />
          </div>
        )}
        <img
          src={NODE_IMAGE_URL(listing.tokenId)}
          alt={`Node #${listing.tokenId}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
        {/* Rarity Badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: rarityColor + '22', border: `1px solid ${rarityColor}55`,
          borderRadius: 4, padding: '2px 6px',
          fontSize: 8, fontWeight: 800, color: rarityColor,
          letterSpacing: 1, textTransform: 'uppercase',
          backdropFilter: 'blur(4px)',
        }}>
          {listing.rarity}
        </div>
        {/* Offer count badge */}
        {listing.offerCount > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: '#C084FC22', border: '1px solid #C084FC55',
            borderRadius: 4, padding: '2px 6px',
            fontSize: 8, fontWeight: 800, color: '#C084FC',
          }}>
            {listing.offerCount} OFFER{listing.offerCount > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? '8px 8px 10px' : '10px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: '#ddd' }}>
            #{listing.tokenId}
          </span>
          <span style={{ fontSize: 9, color: '#445' }}>
            {timeAgo(listing.createdAt)}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {listing.hashpower > 0 && (
            <span style={{ fontSize: 9, color: '#667' }}>
              HP {formatNum(listing.hashpower)}
            </span>
          )}
          {listing.hexesDecoded > 0 && (
            <span style={{ fontSize: 9, color: '#667' }}>
              HEX {formatNum(listing.hexesDecoded)}
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{
          background: '#0a180a', borderRadius: 6, padding: '6px 8px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid #142014',
        }}>
          <span style={{ fontSize: 8, color: '#556', letterSpacing: 1 }}>PRICE</span>
          <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, color: '#4ADE80' }}>
            {listing.price ? `${Number(listing.price).toFixed(1)} GUN` : '—'}
          </span>
        </div>

        {/* Seller */}
        <div style={{ fontSize: 9, color: '#445', marginTop: 6, textAlign: 'right' }}>
          {shortenAddr(listing.seller)}
        </div>
      </div>
    </div>
  );
}

// ─── Activity Feed ───

function ActivityFeed({ activity, isMobile, wallet }) {
  const myAddr = wallet?.address?.toLowerCase() || '';

  const typeConfig = {
    listing: { label: 'LISTED', color: '#60A5FA' },
    sale: { label: 'SOLD', color: '#4ADE80' },
    bought: { label: 'BOUGHT', color: '#60A5FA' },
    cancel: { label: 'CANCELLED', color: '#EF4444' },
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 8 : 16 }}>
      {activity.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#445', fontSize: 12 }}>
          No marketplace activity yet
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {activity.map((a, i) => {
            // Wallet-aware label: show BOUGHT for sales where the connected wallet is the buyer
            let cfgKey = a.type;
            if (a.type === 'sale' && myAddr && a.buyer && myAddr === a.buyer.toLowerCase()) {
              cfgKey = 'bought';
            }
            const cfg = typeConfig[cfgKey] || typeConfig.listing;
            const rarityColor = RARITY_CONFIG[a.rarity]?.color || '#778';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                padding: '10px 12px', borderBottom: '1px solid #0d180d',
              }}>
                <div style={{
                  minWidth: isMobile ? 55 : 70, textAlign: 'center',
                  background: cfg.color + '15', border: `1px solid ${cfg.color}33`,
                  borderRadius: 4, padding: '3px 8px',
                  fontSize: isMobile ? 7 : 9, fontWeight: 800, color: cfg.color,
                  letterSpacing: 1,
                }}>
                  {cfg.label}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>#{a.tokenId}</span>
                  {a.rarity && (
                    <span style={{ fontSize: 9, color: rarityColor, marginLeft: 8 }}>{a.rarity}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', minWidth: isMobile ? 60 : 80, textAlign: 'right' }}>
                  {a.price ? `${Number(a.price).toFixed(1)} GUN` : '—'}
                </div>
                {!isMobile && (
                  <div style={{ fontSize: 9, color: '#445', minWidth: 80, textAlign: 'right' }}>
                    {shortenAddr(a.actor)}
                  </div>
                )}
                <div style={{ fontSize: 9, color: '#334', minWidth: 50, textAlign: 'right' }}>
                  {timeAgo(a.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───

function Divider() {
  return <span style={{ color: '#1a2a1a', margin: '0 2px', fontSize: 12 }}>|</span>;
}

function PaginationBtn({ disabled, onClick, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? '#060b06' : '#0a140a',
        border: '1px solid #1a2a1a', borderRadius: 4,
        color: disabled ? '#333' : '#778',
        padding: '4px 12px', cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: 1,
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

const inputStyle = {
  background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 4,
  color: '#aaa', padding: '3px 6px', fontSize: 10, fontFamily: 'inherit',
  width: 70, outline: 'none',
};

const clearBtnStyle = {
  position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: '#556', cursor: 'pointer',
  fontSize: 9, fontFamily: 'inherit', padding: '0 3px',
};
