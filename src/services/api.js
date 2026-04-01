/**
 * API client for the GUNZ Node Tracker backend.
 * 
 * In development, Vite proxies /api → localhost:3001
 * In production, set VITE_API_URL to the backend URL.
 */

const BASE = import.meta.env.VITE_API_URL || '';

async function request(path) {
  const resp = await fetch(`${BASE}${path}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

/** Fetch all 10,000 nodes (bubble map data) */
export async function fetchNodes() {
  const data = await request('/api/nodes');
  return data;
}

/** Fetch single node detail with history */
export async function fetchNode(id) {
  return request(`/api/nodes/${id}`);
}

/** Fetch global ecosystem stats */
export async function fetchStats() {
  return request('/api/stats');
}

/** Fetch leaderboard with filters */
export async function fetchLeaderboard({ rarity, status, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (rarity) params.set('rarity', rarity);
  if (status) params.set('status', status);
  params.set('limit', limit);
  params.set('offset', offset);
  return request(`/api/leaderboard?${params}`);
}

/** Fetch daily HEX decode counts */
export async function fetchHexes(period = 'month') {
  return request(`/api/hexes?period=${period}`);
}

/** Fetch earnings distribution by rarity */
export async function fetchDistribution(period = 'month') {
  return request(`/api/distribution?period=${period}`);
}

/** Fetch hashpower trend */
export async function fetchHashpower(period = 'month') {
  return request(`/api/hashpower?period=${period}`);
}

/** Fetch node GUN earnings over time */
export async function fetchNodeEarnings(id, period = 'month') {
  return request(`/api/nodes/${id}/earnings?period=${period}`);
}

/** Fetch decoded items breakdown by rarity over time */
export async function fetchDecodedItems(id, period = 'month') {
  return request(`/api/nodes/${id}/decoded-items?period=${period}`);
}

/** Fetch actual NFT items decoded by this node */
export async function fetchNodeItems(id, limit = 20, offset = 0) {
  return request(`/api/nodes/${id}/items?limit=${limit}&offset=${offset}`);
}

/** Fetch Game Items from GunzScan Blockscout API (on-chain data) */
export async function fetchGameItems(id) {
  return request(`/api/nodes/${id}/game-items`);
}

/** Fetch detailed license info (earnedFee, capacity, etc.) */
export async function fetchLicenseInfo(id) {
  return request(`/api/nodes/${id}/info`);
}

/** Search nodes by ID or wallet */
export async function searchNodes(query) {
  return request(`/api/search?q=${encodeURIComponent(query)}`);
}

/** Fetch all nodes for a wallet */
export async function fetchWallet(address) {
  return request(`/api/wallet/${address}`);
}

/** Fetch all owners with aggregated stats */
export async function fetchOwners(limit = 100, offset = 0) {
  return request(`/api/owners?limit=${limit}&offset=${offset}`);
}

/** Health check */
export async function fetchHealth() {
  return request('/api/health');
}

// ─── Marketplace API ───

/** Fetch marketplace listings with filters */
export async function fetchMarketplaceListings({
  rarity, status = 'Active', sort = 'newest',
  minPrice, maxPrice, contract, seller,
  limit = 24, offset = 0,
} = {}) {
  const params = new URLSearchParams();
  if (rarity) params.set('rarity', rarity);
  if (status) params.set('status', status);
  if (sort) params.set('sort', sort);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (contract) params.set('contract', contract);
  if (seller) params.set('seller', seller);
  params.set('limit', limit);
  params.set('offset', offset);
  return request(`/api/marketplace/listings?${params}`);
}

/** Fetch a single marketplace listing with offers and price history */
export async function fetchMarketplaceListing(listingId) {
  return request(`/api/marketplace/listings/${listingId}`);
}

/** Fetch recent marketplace sales */
export async function fetchMarketplaceSales(limit = 50, offset = 0) {
  return request(`/api/marketplace/sales?limit=${limit}&offset=${offset}`);
}

/** Fetch marketplace-wide stats (floor, volume, etc.) */
export async function fetchMarketplaceStats() {
  return request('/api/marketplace/stats');
}

/** Fetch recent marketplace activity feed */
export async function fetchMarketplaceActivity(limit = 30) {
  return request(`/api/marketplace/activity?limit=${limit}`);
}

/** Fetch marketplace data for a specific token */
export async function fetchTokenMarketplace(contract, tokenId) {
  return request(`/api/marketplace/token/${contract}/${tokenId}`);
}
