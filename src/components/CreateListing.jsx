import { useState, useEffect } from 'react';
import { RARITY_CONFIG, NODE_IMAGE_URL, GUNZ_LICENSE_CONTRACT, GUNZ_GAME_ITEM_CONTRACT } from '../utils/constants';
import { formatNum, shortenAddr } from '../utils/format';
import { fetchWallet } from '../services/api';

/**
 * CreateListing modal — allows users to list their Hacker License NFT for sale.
 * In a real integration, this would connect to the user's wallet (MetaMask etc.)
 * and call the GunzMarketplace.list() contract method.
 */
export default function CreateListing({ onClose, isMobile }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletNodes, setWalletNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: connect, 2: select node, 3: set price, 4: confirm

  // Simulate wallet lookup
  const handleLookup = async () => {
    if (!walletAddress || walletAddress.length < 10) return;
    setLoading(true);
    try {
      const data = await fetchWallet(walletAddress);
      setWalletNodes(data.nodes || []);
      setStep(2);
    } catch {
      setWalletNodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setStep(3);
  };

  const handleConfirm = () => {
    setStep(4);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center',
    }}>
      <div style={{
        background: '#080f08', border: '1px solid #142014',
        borderRadius: isMobile ? '16px 16px 0 0' : 12,
        width: isMobile ? '100%' : 460,
        maxHeight: isMobile ? '90vh' : '80vh',
        overflow: 'auto', position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', borderBottom: '1px solid #142014',
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#4ADE80', letterSpacing: 2 }}>
            LIST YOUR NODE
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1a2a1a', borderRadius: 6,
            color: '#778', width: 28, height: 28, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14,
          }}>
            x
          </button>
        </div>

        {/* Step indicators */}
        <div style={{
          display: 'flex', gap: 4, padding: '10px 16px',
          borderBottom: '1px solid #0d180d',
        }}>
          {['WALLET', 'SELECT', 'PRICE', 'CONFIRM'].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', fontSize: 8, fontWeight: 700,
              color: step > i ? '#4ADE80' : step === i + 1 ? '#ddd' : '#334',
              letterSpacing: 1, padding: '4px 0',
              borderBottom: `2px solid ${step > i ? '#4ADE80' : step === i + 1 ? '#4ADE8055' : '#0d180d'}`,
            }}>
              {s}
            </div>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          {/* Step 1: Enter wallet */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 12 }}>
                Enter your wallet address to see your GUNZ Hacker Licenses.
              </div>
              <input
                type="text" placeholder="0x..."
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                style={{
                  width: '100%', background: '#060b06', border: '1px solid #1a2a1a',
                  borderRadius: 8, color: '#ddd', padding: '10px 12px',
                  fontSize: 12, fontFamily: 'inherit', outline: 'none',
                  marginBottom: 12,
                }}
              />
              <button
                onClick={handleLookup}
                disabled={loading || !walletAddress}
                style={{
                  width: '100%', background: loading ? '#0a140a' : 'linear-gradient(135deg, #4ADE80, #22c55e)',
                  color: loading ? '#445' : '#000', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 12, fontWeight: 800,
                  fontFamily: 'inherit', cursor: loading ? 'default' : 'pointer',
                  letterSpacing: 2,
                }}
              >
                {loading ? 'LOOKING UP...' : 'FIND MY NODES'}
              </button>
              <div style={{ fontSize: 9, color: '#334', marginTop: 12, textAlign: 'center' }}>
                In production, this will connect to your wallet automatically.
              </div>
            </div>
          )}

          {/* Step 2: Select node */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 12 }}>
                Select a node to list ({walletNodes.length} found)
              </div>
              {walletNodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#445', fontSize: 11 }}>
                  No nodes found for this wallet
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflow: 'auto' }}>
                  {walletNodes.map(node => {
                    const rc = RARITY_CONFIG[node.rarity]?.color || '#778';
                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelectNode(node)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', cursor: 'pointer', borderRadius: 6,
                          border: '1px solid #0d180d', marginBottom: 4,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#0c180c';
                          e.currentTarget.style.borderColor = rc + '44';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#0d180d';
                        }}
                      >
                        <img
                          src={NODE_IMAGE_URL(node.id)}
                          alt={`#${node.id}`}
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: '#060b06' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>#{node.id}</div>
                          <div style={{ fontSize: 9, color: rc }}>{node.rarity}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#667' }}>HP {formatNum(node.hashpower)}</div>
                          <div style={{ fontSize: 10, color: '#667' }}>HEX {formatNum(node.hexesDecoded)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setStep(1)} style={{
                marginTop: 12, background: 'none', border: '1px solid #1a2a1a',
                borderRadius: 6, color: '#556', padding: '6px 12px', fontSize: 10,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
                &#8592; BACK
              </button>
            </div>
          )}

          {/* Step 3: Set price */}
          {step === 3 && selectedNode && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                padding: '10px 12px', background: '#0a140a', borderRadius: 8,
                border: '1px solid #0d180d',
              }}>
                <img
                  src={NODE_IMAGE_URL(selectedNode.id)}
                  alt={`#${selectedNode.id}`}
                  style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', background: '#060b06' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ddd' }}>#{selectedNode.id}</div>
                  <div style={{ fontSize: 10, color: RARITY_CONFIG[selectedNode.rarity]?.color || '#778' }}>
                    {selectedNode.rarity} &middot; HP {formatNum(selectedNode.hashpower)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#778', marginBottom: 8 }}>Set your asking price</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input
                  type="number" placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  style={{
                    flex: 1, background: '#060b06', border: '1px solid #1a2a1a',
                    borderRadius: 8, color: '#ddd', padding: '12px',
                    fontSize: 18, fontWeight: 800, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#4ADE80' }}>GUN</span>
              </div>

              <div style={{ fontSize: 9, color: '#445', marginBottom: 8 }}>
                Seller fee: 3% &middot; You receive: {price ? (Number(price) * 0.97).toFixed(2) : '0.00'} GUN
              </div>
              <div style={{ fontSize: 9, color: '#EF444488', marginBottom: 16 }}>
                Cancel penalty: 100 GUN &middot; NFT will be escrowed in the contract
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setStep(2); setPrice(''); }} style={{
                  flex: 1, background: 'none', border: '1px solid #1a2a1a',
                  borderRadius: 8, color: '#778', padding: '10px', fontSize: 11,
                  fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                }}>
                  BACK
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!price || parseFloat(price) <= 0}
                  style={{
                    flex: 2,
                    background: (!price || parseFloat(price) <= 0) ? '#0a140a' : 'linear-gradient(135deg, #4ADE80, #22c55e)',
                    color: (!price || parseFloat(price) <= 0) ? '#334' : '#000',
                    border: 'none', borderRadius: 8, padding: '10px', fontSize: 12,
                    fontWeight: 800, fontFamily: 'inherit',
                    cursor: (!price || parseFloat(price) <= 0) ? 'default' : 'pointer',
                    letterSpacing: 2,
                  }}
                >
                  REVIEW LISTING
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && selectedNode && (
            <div>
              <div style={{
                background: '#0a180a', border: '1px solid #1a3a1a', borderRadius: 10,
                padding: 16, marginBottom: 16, textAlign: 'center',
              }}>
                <img
                  src={NODE_IMAGE_URL(selectedNode.id)}
                  alt={`#${selectedNode.id}`}
                  style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', marginBottom: 12, background: '#060b06' }}
                />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#ddd', marginBottom: 4 }}>
                  Node #{selectedNode.id}
                </div>
                <div style={{ fontSize: 10, color: RARITY_CONFIG[selectedNode.rarity]?.color || '#778', marginBottom: 12 }}>
                  {selectedNode.rarity}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#4ADE80', marginBottom: 4 }}>
                  {Number(price).toFixed(2)} GUN
                </div>
                <div style={{ fontSize: 9, color: '#445' }}>
                  You receive: {(Number(price) * 0.97).toFixed(2)} GUN after 3% fee
                </div>
              </div>

              {/* Escrow notice */}
              <div style={{
                background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 8,
                padding: 12, marginBottom: 12,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#4ADE80', letterSpacing: 1, marginBottom: 4 }}>NFT ESCROW</div>
                <div style={{ fontSize: 9, color: '#778', lineHeight: 1.6 }}>
                  Your NFT will be transferred into the marketplace contract and held in escrow until sold or cancelled.
                </div>
              </div>

              {/* Cancel penalty warning */}
              <div style={{
                background: '#1a0d0d', border: '1px solid #3a1a1a', borderRadius: 8,
                padding: 12, marginBottom: 16,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', letterSpacing: 1, marginBottom: 4 }}>CANCEL PENALTY</div>
                <div style={{ fontSize: 9, color: '#778', lineHeight: 1.6 }}>
                  If you cancel this listing, a penalty of <strong style={{ color: '#EF4444' }}>100 GUN</strong> will be charged.
                  All pending offers will be automatically refunded to bidders.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(3)} style={{
                  flex: 1, background: 'none', border: '1px solid #1a2a1a',
                  borderRadius: 8, color: '#778', padding: '10px', fontSize: 11,
                  fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                }}>
                  BACK
                </button>
                <button style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
                  color: '#000', border: 'none', borderRadius: 8, padding: '12px',
                  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  cursor: 'pointer', letterSpacing: 2,
                  boxShadow: '0 0 20px #4ADE8033',
                }}>
                  ESCROW & LIST
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
