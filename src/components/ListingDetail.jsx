import { useState, useEffect } from 'react';
import { RARITY_CONFIG, NODE_IMAGE_URL, GUNZSCAN_NODE_URL } from '../utils/constants';
import { formatNum, shortenAddr, timeAgo } from '../utils/format';
import { fetchMarketplaceListing } from '../services/api';

export default function ListingDetail({ listing: initialListing, onClose, onSelectNode, isMobile }) {
  const [listing, setListing] = useState(initialListing);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);

  const rarityColor = RARITY_CONFIG[listing.rarity]?.color || '#778';

  useEffect(() => {
    fetchMarketplaceListing(initialListing.listingId)
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [initialListing.listingId]);

  const node = listing.node || {};
  const offers = listing.offers || [];
  const priceHistory = listing.priceHistory || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center',
    }}>
      <div style={{
        background: '#080f08', border: '1px solid #142014', borderRadius: isMobile ? '16px 16px 0 0' : 12,
        width: isMobile ? '100%' : 520, maxHeight: isMobile ? '92vh' : '85vh',
        overflow: 'auto', position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'sticky', top: 8, right: 8, float: 'right', zIndex: 2,
          background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 6,
          color: '#778', width: 28, height: 28, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '8px 8px 0 0',
        }}>
          x
        </button>

        {/* Image */}
        <div style={{
          position: 'relative', width: '100%', paddingTop: '60%',
          background: '#060b06', overflow: 'hidden',
        }}>
          {!imgLoaded && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0a140a', animation: 'pulse 1.5s infinite' }} />
            </div>
          )}
          <img
            src={NODE_IMAGE_URL(listing.tokenId)}
            alt={`Node #${listing.tokenId}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            borderRadius: 8, padding: '8px 14px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              #{listing.tokenId}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: rarityColor, letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              {listing.rarity}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? 14 : 20 }}>
          {/* Price Section */}
          <div style={{
            background: '#0a180a', border: '1px solid #142014', borderRadius: 10,
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 9, color: '#556', letterSpacing: 2, marginBottom: 4 }}>CURRENT PRICE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#4ADE80', marginBottom: 12 }}>
              {listing.price ? `${Number(listing.price).toFixed(2)} GUN` : '—'}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* Buy Button */}
              {listing.status === 'Active' && (
                <button
                  onClick={() => setShowBuyConfirm(true)}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
                    color: '#000', border: 'none', borderRadius: 8,
                    padding: '10px 20px', fontSize: 12, fontWeight: 800,
                    fontFamily: 'inherit', letterSpacing: 2, cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  BUY NOW
                </button>
              )}

              {/* Make Offer Button */}
              {listing.status === 'Active' && (
                <button
                  onClick={() => setShowOfferInput(!showOfferInput)}
                  style={{
                    flex: 1, background: 'transparent',
                    color: '#60A5FA', border: '1px solid #60A5FA44',
                    borderRadius: 8, padding: '10px 20px', fontSize: 12,
                    fontWeight: 800, fontFamily: 'inherit', letterSpacing: 2,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#60A5FA11';
                    e.currentTarget.style.borderColor = '#60A5FA88';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#60A5FA44';
                  }}
                >
                  MAKE OFFER
                </button>
              )}

              {listing.status === 'Sold' && (
                <div style={{
                  flex: 1, textAlign: 'center', padding: '10px 20px',
                  background: '#1a0a0a', border: '1px solid #3a1a1a',
                  borderRadius: 8, fontSize: 12, fontWeight: 800,
                  color: '#EF4444', letterSpacing: 2,
                }}>
                  SOLD
                </div>
              )}
            </div>

            {/* Offer input */}
            {showOfferInput && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <input
                  type="number" placeholder="GUN amount"
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  style={{
                    flex: 1, background: '#060b06', border: '1px solid #1a2a1a',
                    borderRadius: 6, color: '#ddd', padding: '8px 10px',
                    fontSize: 12, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button style={{
                  background: '#60A5FA22', border: '1px solid #60A5FA55',
                  borderRadius: 6, color: '#60A5FA', padding: '8px 16px',
                  fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', letterSpacing: 1,
                }}>
                  SUBMIT
                </button>
              </div>
            )}
          </div>

          {/* Buy Confirmation Modal */}
          {showBuyConfirm && (
            <div style={{
              background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 10,
              padding: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                Confirm purchase of <strong style={{ color: '#fff' }}>Node #{listing.tokenId}</strong> for{' '}
                <strong style={{ color: '#4ADE80' }}>{Number(listing.price).toFixed(2)} GUN</strong>?
              </div>
              <div style={{ fontSize: 9, color: '#556', marginBottom: 12 }}>
                This will require a wallet transaction on the GUNZ chain.
                A 2.5% platform fee applies.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{
                  flex: 1, background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
                  color: '#000', border: 'none', borderRadius: 6,
                  padding: '8px', fontSize: 11, fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                }}>
                  CONFIRM
                </button>
                <button onClick={() => setShowBuyConfirm(false)} style={{
                  flex: 1, background: 'transparent',
                  color: '#778', border: '1px solid #1a2a1a', borderRadius: 6,
                  padding: '8px', fontSize: 11, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                }}>
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Node Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8, marginBottom: 16,
          }}>
            {[
              { l: 'HASHPOWER', v: formatNum(node.hashpower || listing.hashpower || 0), c: '#60A5FA' },
              { l: 'HEXES', v: formatNum(node.hexesDecoded || listing.hexesDecoded || 0), c: '#FBBF24' },
              { l: 'STATUS', v: node.activity || '—', c: node.activity === 'Active' ? '#4ADE80' : '#EF4444' },
              { l: 'DISTRIBUTION', v: node.hexesDistributionRate ? `${Number(node.hexesDistributionRate).toFixed(4)}%` : '—', c: '#C084FC' },
            ].map((s, i) => (
              <div key={i} style={{
                background: '#0a140a', border: '1px solid #0d180d',
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 8, color: '#445', letterSpacing: 1, marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Seller Info */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px', background: '#0a140a', border: '1px solid #0d180d',
            borderRadius: 8, marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 8, color: '#445', letterSpacing: 1, marginBottom: 2 }}>SELLER</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{shortenAddr(listing.seller)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a
                href={GUNZSCAN_NODE_URL(listing.tokenId)}
                target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#0d180d', border: '1px solid #1a2a1a', borderRadius: 4,
                  color: '#556', padding: '3px 8px', fontSize: 9, textDecoration: 'none',
                  fontFamily: 'inherit',
                }}
              >
                GUNZSCAN
              </a>
              <button
                onClick={() => { onSelectNode?.({ id: listing.tokenId, rarity: listing.rarity }); onClose(); }}
                style={{
                  background: '#0d180d', border: '1px solid #1a2a1a', borderRadius: 4,
                  color: '#4ADE80', padding: '3px 8px', fontSize: 9, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                VIEW NODE
              </button>
            </div>
          </div>

          {/* Active Offers */}
          {offers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#556', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
                OFFERS ({offers.filter(o => !o.accepted && !o.withdrawn).length})
              </div>
              {offers
                .filter(o => !o.accepted && !o.withdrawn)
                .map((offer, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderBottom: '1px solid #0d180d',
                  }}>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{shortenAddr(offer.bidder)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>
                      {Number(offer.amount).toFixed(2)} GUN
                    </span>
                    <span style={{ fontSize: 9, color: '#334' }}>{timeAgo(offer.createdAt)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Price History */}
          {priceHistory.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: '#556', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>
                SALE HISTORY
              </div>
              {priceHistory.map((sale, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px', borderBottom: '1px solid #0d180d',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>
                    {Number(sale.price).toFixed(2)} GUN
                  </span>
                  <span style={{ fontSize: 9, color: '#445' }}>{shortenAddr(sale.buyer)}</span>
                  <span style={{ fontSize: 9, color: '#334' }}>{timeAgo(sale.soldAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Listed time */}
          <div style={{ fontSize: 9, color: '#334', textAlign: 'center', marginTop: 16 }}>
            Listed {timeAgo(listing.createdAt)}
            {listing.txHash && (
              <span> &middot; <a
                href={`https://gunzscan.io/tx/${listing.txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: '#445', textDecoration: 'none' }}
              >
                TX
              </a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
