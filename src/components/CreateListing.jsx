import { useState, useEffect } from 'react';
import { RARITY_CONFIG, NODE_IMAGE_URL, GUNZ_LICENSE_CONTRACT } from '../utils/constants';
import { formatNum, shortenAddr } from '../utils/format';
import { fetchWallet } from '../services/api';
import { approveNft, listNft, checkApproval } from '../services/marketplace';

/**
 * OpenSea-style listing flow wired to real contract calls:
 *   Step 1: Select NFT from wallet
 *   Step 2: Set price
 *   Step 3: Review & confirm
 *   Step 4: Approve tx → List tx → Success
 */
export default function CreateListing({ onClose, isMobile, walletAddress }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Step 4 sub-states
  const [txPhase, setTxPhase] = useState(null); // 'approve' | 'list' | 'done' | 'error'
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [listingId, setListingId] = useState(null);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    fetchWallet(walletAddress)
      .then(data => { setNodes(data.nodes || []); setLoading(false); })
      .catch(() => { setNodes([]); setLoading(false); });
  }, [walletAddress]);

  const priceNum = parseFloat(price) || 0;
  const fee = priceNum * 0.03;
  const proceeds = priceNum - fee;

  const handleList = async () => {
    setStep(4);
    setTxError(null);
    const nftContract = GUNZ_LICENSE_CONTRACT;
    const tokenId = selectedNode.id;

    try {
      // Phase 1: Check approval, approve if needed
      setTxPhase('approve');
      const isApproved = await checkApproval(nftContract, tokenId, walletAddress);
      if (!isApproved) {
        await approveNft(nftContract, tokenId);
      }

      // Phase 2: List (escrow NFT)
      setTxPhase('list');
      const result = await listNft(nftContract, tokenId, price);
      setTxHash(result.hash);
      setListingId(result.listingId);
      setTxPhase('done');
    } catch (err) {
      console.error('Listing failed:', err);
      setTxError(err.code === 'ACTION_REJECTED' ? 'Transaction rejected in wallet' : (err.reason || err.message || 'Transaction failed'));
      setTxPhase('error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center',
    }}>
      <div style={{
        background: '#080f08', border: '1px solid #142014',
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        width: isMobile ? '100%' : 480, maxHeight: isMobile ? '90vh' : '82vh', overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #142014' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e0e0e0', letterSpacing: 1 }}>
              {step === 1 ? 'List for Sale' : step === 2 ? 'Set Price' : step === 3 ? 'Review Listing' : txPhase === 'done' ? 'Listed!' : txPhase === 'error' ? 'Failed' : 'Processing...'}
            </div>
            <div style={{ fontSize: 9, color: '#445', marginTop: 2 }}>{shortenAddr(walletAddress)}</div>
          </div>
          <button onClick={onClose} style={{ background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 8, color: '#556', width: 32, height: 32, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', height: 3, background: '#0d180d' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, background: step >= s ? (txPhase === 'error' ? '#EF4444' : '#4ADE80') : '#0d180d', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* ── Step 1: Select NFT ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, color: '#778', marginBottom: 12 }}>Choose an NFT from your wallet to list on the marketplace.</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#445' }}><div style={{ animation: 'pulse 1.5s infinite', fontSize: 11 }}>Loading your NFTs...</div></div>
              ) : nodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 24, color: '#223', marginBottom: 8 }}>No NFTs found</div><div style={{ fontSize: 11, color: '#445' }}>This wallet doesn't own any GUNZ Hacker Licenses.</div></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {nodes.map(node => {
                    const rc = RARITY_CONFIG[node.rarity]?.color || '#778';
                    return (
                      <div key={node.id} onClick={() => { setSelectedNode(node); setStep(2); }}
                        style={{ background: '#0a140a', border: '1px solid #142014', borderRadius: 10, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = rc + '44'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#142014'}>
                        <div style={{ position: 'relative', paddingTop: '80%', background: '#060b06' }}>
                          <img src={NODE_IMAGE_URL(node.id)} alt={`#${node.id}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: 4, left: 4, background: rc + '22', border: `1px solid ${rc}44`, borderRadius: 4, padding: '1px 5px', fontSize: 7, fontWeight: 800, color: rc, letterSpacing: 1 }}>{node.rarity?.toUpperCase()}</div>
                        </div>
                        <div style={{ padding: '6px 8px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#ddd' }}>#{node.id}</div>
                          <div style={{ fontSize: 8, color: '#556' }}>HP {formatNum(node.hashpower)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Set Price ── */}
          {step === 2 && selectedNode && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px', background: '#0a140a', borderRadius: 10, border: '1px solid #0d180d' }}>
                <img src={NODE_IMAGE_URL(selectedNode.id)} alt={`#${selectedNode.id}`} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: '#060b06' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ddd' }}>Node #{selectedNode.id}</div>
                  <div style={{ fontSize: 10, color: RARITY_CONFIG[selectedNode.rarity]?.color || '#778' }}>{selectedNode.rarity} &middot; HP {formatNum(selectedNode.hashpower)}</div>
                </div>
                <button onClick={() => { setStep(1); setSelectedNode(null); setPrice(''); }} style={{ background: 'none', border: '1px solid #1a2a1a', borderRadius: 6, color: '#556', padding: '4px 8px', fontSize: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#778', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>LISTING PRICE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#060b06', border: '1px solid #1a2a1a', borderRadius: 10, padding: '4px 12px' }}>
                  <input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#ddd', padding: '10px 0', fontSize: 22, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#4ADE80' }}>GUN</span>
                </div>
              </div>
              <div style={{ background: '#0a140a', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                <Row l="Listing price" v={priceNum ? `${priceNum.toFixed(2)} GUN` : '—'} />
                <Row l="Seller fee (3%)" v={priceNum ? `-${fee.toFixed(2)} GUN` : '—'} vc="#EF4444" />
                <div style={{ height: 1, background: '#142014', margin: '6px 0' }} />
                <Row l="You receive" v={priceNum ? `${proceeds.toFixed(2)} GUN` : '—'} vc="#4ADE80" vb />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <InfoBox color="#4ADE80" title="ESCROW" desc="NFT held in contract until sold or cancelled" />
                <InfoBox color="#EF4444" title="CANCEL FEE" desc="100 GUN penalty if you unlist" />
              </div>
              <button onClick={() => priceNum > 0 && setStep(3)} disabled={!priceNum || priceNum <= 0}
                style={{ width: '100%', background: priceNum > 0 ? 'linear-gradient(135deg, #4ADE80, #22c55e)' : '#0a140a', color: priceNum > 0 ? '#000' : '#334', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: priceNum > 0 ? 'pointer' : 'default', letterSpacing: 2 }}>CONTINUE</button>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && selectedNode && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={NODE_IMAGE_URL(selectedNode.id)} alt={`#${selectedNode.id}`} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', marginBottom: 10, background: '#060b06' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#ddd' }}>Node #{selectedNode.id}</div>
                <div style={{ fontSize: 10, color: RARITY_CONFIG[selectedNode.rarity]?.color }}>{selectedNode.rarity}</div>
              </div>
              <div style={{ background: '#0a180a', border: '1px solid #142014', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <Row l="Price" v={`${priceNum.toFixed(2)} GUN`} vc="#4ADE80" vb />
                <Row l="Seller fee (3%)" v={`-${fee.toFixed(2)} GUN`} vc="#EF4444" />
                <Row l="You receive" v={`${proceeds.toFixed(2)} GUN`} vc="#4ADE80" vb />
              </div>
              <div style={{ fontSize: 10, color: '#556', marginBottom: 16, lineHeight: 1.7 }}>
                Two transactions will be requested:
                <div style={{ marginTop: 6 }}>
                  <div style={{ color: '#778', marginBottom: 2 }}>1. <strong>Approve</strong> — Allow marketplace to transfer your NFT</div>
                  <div style={{ color: '#778' }}>2. <strong>List</strong> — Escrow NFT in marketplace contract</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: 'transparent', border: '1px solid #1a2a1a', borderRadius: 10, color: '#778', padding: '12px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1 }}>BACK</button>
                <button onClick={handleList} style={{ flex: 2, background: 'linear-gradient(135deg, #4ADE80, #22c55e)', color: '#000', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 2, boxShadow: '0 0 20px #4ADE8033' }}>APPROVE & LIST</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Transaction Progress ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {txPhase === 'approve' && <TxSpinner label="Approving NFT transfer..." sub="Confirm the approval transaction in your wallet" />}
              {txPhase === 'list' && <TxSpinner label="Listing NFT on marketplace..." sub="Confirm the listing transaction in your wallet" />}
              {txPhase === 'done' && (
                <>
                  <SuccessIcon />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80', marginBottom: 6, letterSpacing: 1 }}>Listed!</div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 6 }}>Node #{selectedNode?.id} is now listed for {priceNum.toFixed(2)} GUN</div>
                  {listingId && <div style={{ fontSize: 9, color: '#445', marginBottom: 4 }}>Listing ID: {listingId}</div>}
                  {txHash && (
                    <a href={`https://gunzscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 9, color: '#4ADE80', textDecoration: 'none' }}>View on GunzScan &#8599;</a>
                  )}
                  <div style={{ marginTop: 20 }}>
                    <button onClick={onClose} style={{ background: '#0a140a', border: '1px solid #1a2a1a', borderRadius: 8, color: '#778', padding: '10px 24px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1 }}>DONE</button>
                  </div>
                </>
              )}
              {txPhase === 'error' && (
                <>
                  <ErrorIcon />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Transaction Failed</div>
                  <div style={{ fontSize: 10, color: '#556', marginBottom: 20, maxWidth: 300, margin: '0 auto 20px', wordBreak: 'break-word' }}>{txError}</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => { setStep(3); setTxPhase(null); setTxError(null); }} style={{ background: 'transparent', border: '1px solid #1a2a1a', borderRadius: 8, color: '#778', padding: '10px 20px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1 }}>BACK</button>
                    <button onClick={handleList} style={{ background: 'linear-gradient(135deg, #4ADE80, #22c55e)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1 }}>TRY AGAIN</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ─── Shared sub-components ───

function Row({ l, v, vc, vb }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: '#556' }}>{l}</span>
      <span style={{ fontSize: vb ? 12 : 10, color: vc || '#aaa', fontWeight: vb ? 800 : 400 }}>{v}</span>
    </div>
  );
}
function InfoBox({ color, title, desc }) {
  return (
    <div style={{ flex: 1, background: color === '#4ADE80' ? '#0d1a0d' : '#1a0d0d', border: `1px solid ${color === '#4ADE80' ? '#1a3a1a' : '#3a1a1a'}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 9, color: '#667', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}
function TxSpinner({ label, sub }) {
  return (
    <>
      <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #142014', borderTopColor: '#4ADE80', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: '#ddd', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 10, color: '#556' }}>{sub}</div>
    </>
  );
}
function SuccessIcon() {
  return <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0a180a', border: '2px solid #4ADE8066', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: '#4ADE80' }}>&#10003;</div>;
}
function ErrorIcon() {
  return <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a0a0a', border: '2px solid #EF444444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: '#EF4444' }}>!</div>;
}
