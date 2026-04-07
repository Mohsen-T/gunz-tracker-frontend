/**
 * Marketplace contract service.
 * Provides all on-chain interactions: list, buy, cancel, offer, approve.
 * Uses window.ethereum (MetaMask) as the provider.
 */

import { MARKETPLACE_ABI } from './marketplaceAbi';
import { GUNZ_MARKETPLACE_CONTRACT, GUNZ_LICENSE_CONTRACT, GUNZ_GAME_ITEM_CONTRACT, GUNZ_RPC_URL } from '../utils/constants';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Notify backend of a successful on-chain action so the DB stays in sync.
// (Local Hardhat doesn't get indexed by the GunzScan-based marketplaceSync.)
async function reportToBackend(type, data) {
  try {
    await fetch(`${API_BASE}/api/marketplace/local-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
    });
  } catch (err) {
    console.warn('[marketplace] backend sync failed:', err.message);
  }
}

const ERC721_ABI = [
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
];

let _ethers = null;

async function getEthers() {
  if (_ethers) return _ethers;
  // Dynamic import — ethers is loaded only when needed
  _ethers = await import('ethers');
  return _ethers;
}

function getMarketplaceAddress() {
  return GUNZ_MARKETPLACE_CONTRACT;
}

/**
 * Get ethers provider from MetaMask.
 */
async function getProvider() {
  if (!window.ethereum) throw new Error('No wallet detected');
  const { BrowserProvider } = await getEthers();
  return new BrowserProvider(window.ethereum);
}

/**
 * Get signer from connected wallet.
 */
async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

/**
 * Get marketplace contract instance (read-only or with signer).
 */
async function getMarketplaceContract(withSigner = false) {
  const { Contract } = await getEthers();
  if (withSigner) {
    const signer = await getSigner();
    return new Contract(getMarketplaceAddress(), MARKETPLACE_ABI, signer);
  }
  const provider = await getProvider();
  return new Contract(getMarketplaceAddress(), MARKETPLACE_ABI, provider);
}

/**
 * Get ERC721 contract instance for NFT approval.
 */
async function getNftContract(nftAddress, withSigner = false) {
  const { Contract, Interface } = await getEthers();
  const iface = new Interface(ERC721_ABI);
  if (withSigner) {
    const signer = await getSigner();
    return new Contract(nftAddress, iface, signer);
  }
  const provider = await getProvider();
  return new Contract(nftAddress, iface, provider);
}

// ═══════════════════════════════════════════
// READ FUNCTIONS (no gas)
// ═══════════════════════════════════════════

/**
 * Get GUN balance for an address.
 */
export async function getBalance(address) {
  const provider = await getProvider();
  const balance = await provider.getBalance(address);
  const { formatEther } = await getEthers();
  return parseFloat(formatEther(balance));
}

/**
 * Get marketplace config from contract.
 */
export async function getContractConfig() {
  const mp = await getMarketplaceContract();
  const [feeBps, penalty, minOffer, duration] = await Promise.all([
    mp.sellerFeeBps(),
    mp.cancelPenalty(),
    mp.minOfferAmount(),
    mp.offerDuration(),
  ]);
  const { formatEther } = await getEthers();
  return {
    sellerFeeBps: Number(feeBps),
    cancelPenalty: parseFloat(formatEther(penalty)),
    minOfferAmount: parseFloat(formatEther(minOffer)),
    offerDurationSeconds: Number(duration),
  };
}

/**
 * Check if NFT is approved for marketplace.
 */
export async function checkApproval(nftContract, tokenId, ownerAddress) {
  const nft = await getNftContract(nftContract);
  const approved = await nft.getApproved(BigInt(tokenId));
  if (approved.toLowerCase() === getMarketplaceAddress().toLowerCase()) return true;
  const approvedAll = await nft.isApprovedForAll(ownerAddress, getMarketplaceAddress());
  return approvedAll;
}

/**
 * Get listing data from contract.
 */
export async function getListing(listingId) {
  const mp = await getMarketplaceContract();
  return mp.getListing(listingId);
}

/**
 * Get offer data from contract.
 */
export async function getOffer(offerId) {
  const mp = await getMarketplaceContract();
  return mp.getOffer(offerId);
}

/**
 * Check if offer is expired.
 */
export async function isOfferExpired(offerId) {
  const mp = await getMarketplaceContract();
  return mp.isOfferExpired(offerId);
}

// ═══════════════════════════════════════════
// WRITE FUNCTIONS (requires gas)
// ═══════════════════════════════════════════

/**
 * Approve NFT for marketplace (step 1 of listing).
 * @returns {Promise<{hash: string}>} Transaction receipt
 */
export async function approveNft(nftContract, tokenId) {
  const nft = await getNftContract(nftContract, true);
  const tx = await nft.approve(getMarketplaceAddress(), BigInt(tokenId));
  const receipt = await tx.wait();
  return { hash: receipt.hash };
}

/**
 * List an NFT for sale (step 2 — NFT is escrowed in contract).
 * @param {string} nftContract - NFT contract address
 * @param {number} tokenId - Token ID
 * @param {string} priceGun - Price in GUN (e.g. "100.5")
 * @returns {Promise<{hash: string, listingId: number}>}
 */
export async function listNft(nftContract, tokenId, priceGun) {
  const { parseEther } = await getEthers();
  const mp = await getMarketplaceContract(true);
  const tx = await mp.list(nftContract, BigInt(tokenId), parseEther(String(priceGun)));
  const receipt = await tx.wait();

  // Parse Listed event
  let listingId = null;
  let seller = null;
  for (const log of receipt.logs) {
    try {
      const parsed = mp.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'Listed') {
        listingId = Number(parsed.args.listingId);
        seller = parsed.args.seller;
        break;
      }
    } catch {}
  }

  if (listingId != null) {
    await reportToBackend('listed', {
      listingId, nftContract, tokenId: String(tokenId),
      seller, price: priceGun, txHash: receipt.hash,
    });
  }

  return { hash: receipt.hash, listingId };
}

/**
 * Buy a listed NFT at asking price.
 * @param {number} listingId
 * @param {string} priceGun - Price in GUN
 * @returns {Promise<{hash: string}>}
 */
export async function buyNft(listingId, priceGun) {
  const { parseEther } = await getEthers();
  const mp = await getMarketplaceContract(true);
  const tx = await mp.buy(BigInt(listingId), { value: parseEther(String(priceGun)) });
  const receipt = await tx.wait();

  // Parse Sale event for buyer + fee
  let buyer = null, fee = '0';
  for (const log of receipt.logs) {
    try {
      const parsed = mp.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'Sale') {
        buyer = parsed.args.buyer;
        fee = (Number(parsed.args.fee) / 1e18).toString();
        break;
      }
    } catch {}
  }

  await reportToBackend('sale', {
    listingId, buyer, price: priceGun, fee, txHash: receipt.hash,
  });

  return { hash: receipt.hash };
}

/**
 * Cancel a listing (pays penalty, returns escrowed NFT).
 * @param {number} listingId
 * @param {string} penaltyGun - Penalty in GUN
 * @returns {Promise<{hash: string}>}
 */
export async function cancelListing(listingId, penaltyGun) {
  const { parseEther } = await getEthers();
  const mp = await getMarketplaceContract(true);
  const tx = await mp.cancelListing(BigInt(listingId), { value: parseEther(String(penaltyGun)) });
  const receipt = await tx.wait();

  await reportToBackend('cancelled', {
    listingId, penalty: penaltyGun, txHash: receipt.hash,
  });

  return { hash: receipt.hash };
}

/**
 * Update listing price.
 * @param {number} listingId
 * @param {string} newPriceGun
 * @returns {Promise<{hash: string}>}
 */
export async function updateListingPrice(listingId, newPriceGun) {
  const { parseEther } = await getEthers();
  const mp = await getMarketplaceContract(true);
  const tx = await mp.updatePrice(BigInt(listingId), parseEther(String(newPriceGun)));
  const receipt = await tx.wait();
  return { hash: receipt.hash };
}

/**
 * Place an offer on a listing (GUN escrowed).
 * @param {number} listingId
 * @param {string} amountGun
 * @returns {Promise<{hash: string, offerId: number}>}
 */
export async function placeOffer(listingId, amountGun) {
  const { parseEther } = await getEthers();

  // Sanity check: verify the marketplace contract exists at this address
  const provider = await getProvider();
  const code = await provider.getCode(getMarketplaceAddress());
  if (!code || code === '0x') {
    throw new Error(`No contract at ${getMarketplaceAddress()} — was your local node restarted? Re-deploy the marketplace.`);
  }

  const mp = await getMarketplaceContract(true);

  // Verify listing is active on-chain before placing offer
  try {
    const listing = await mp.getListing(BigInt(listingId));
    if (Number(listing.status) !== 0) {
      throw new Error(`Listing #${listingId} is not active on-chain (status=${listing.status}). DB may be out of sync — re-run setup-test.js and seed-db.js.`);
    }
  } catch (err) {
    if (err.message?.startsWith('Listing #')) throw err;
    throw new Error(`Failed to read listing from contract: ${err.message}`);
  }

  const tx = await mp.placeOffer(BigInt(listingId), { value: parseEther(String(amountGun)) });
  const receipt = await tx.wait();

  let offerId = null, bidder = null, expiresAt = null;
  for (const log of receipt.logs) {
    try {
      const parsed = mp.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'OfferPlaced') {
        offerId = Number(parsed.args.offerId);
        bidder = parsed.args.bidder;
        expiresAt = Number(parsed.args.expiresAt) * 1000;
        break;
      }
    } catch {}
  }

  if (offerId != null) {
    await reportToBackend('offer-placed', {
      offerId, listingId, bidder, amount: amountGun, expiresAt, txHash: receipt.hash,
    });
  }

  return { hash: receipt.hash, offerId };
}

/**
 * Accept an offer (seller only).
 * @param {number} offerId
 * @returns {Promise<{hash: string}>}
 */
export async function acceptOffer(offerId) {
  const mp = await getMarketplaceContract(true);
  const tx = await mp.acceptOffer(BigInt(offerId));
  const receipt = await tx.wait();

  // Parse OfferAccepted for full details
  let listingId = null, bidder = null, amount = '0', fee = '0';
  for (const log of receipt.logs) {
    try {
      const parsed = mp.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'OfferAccepted') {
        listingId = Number(parsed.args.listingId);
        bidder = parsed.args.bidder;
        amount = (Number(parsed.args.amount) / 1e18).toString();
        fee = (Number(parsed.args.fee) / 1e18).toString();
        break;
      }
    } catch {}
  }

  if (listingId != null) {
    await reportToBackend('offer-accepted', {
      offerId, listingId, bidder, amount, fee, txHash: receipt.hash,
    });
  }

  return { hash: receipt.hash };
}

/**
 * Withdraw an offer (reclaim escrowed GUN).
 * @param {number} offerId
 * @returns {Promise<{hash: string}>}
 */
export async function withdrawOffer(offerId) {
  const mp = await getMarketplaceContract(true);
  const tx = await mp.withdrawOffer(BigInt(offerId));
  const receipt = await tx.wait();

  await reportToBackend('offer-withdrawn', {
    offerId, txHash: receipt.hash,
  });

  return { hash: receipt.hash };
}
