export const RARITY_CONFIG = {
  Common:    { color: '#4ADE80', glow: '#22c55e', hashpower: 40,    hpPct: 0.00331946 },
  Rare:      { color: '#60A5FA', glow: '#3b82f6', hashpower: 120,   hpPct: 0.00995839 },
  Epic:      { color: '#C084FC', glow: '#a855f7', hashpower: 600,   hpPct: 0.04977766 },
  Legendary: { color: '#FBBF24', glow: '#f59e0b', hashpower: 3000,  hpPct: 0.2488883 },
  Ancient:   { color: '#EF4444', glow: '#dc2626', hashpower: 20000, hpPct: 1.6592553 },
};

export const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Ancient'];

export const STATUS_CONFIG = {
  Active:   { color: '#4ADE80', icon: '●', label: 'ACTIVE' },
  Inactive: { color: '#EF4444', icon: '○', label: 'INACTIVE' },
};

export const RESALE_RATES = {
  Common: '1%', Rare: '2%', Epic: '3%', Legendary: '4%', Ancient: '5%',
};

export const ITEM_RARITY_COLORS = {
  Uncommon: '#4ADE80', Rare: '#60A5FA', Epic: '#C084FC', Legendary: '#FBBF24',
  Common: '#9CA3AF', Refined: '#34D399', Elite: '#818CF8', Classified: '#F472B6',
};

export const NODE_IMAGE_URL = (id) =>
  `https://hacker-images.fra1.digitaloceanspaces.com/licenses/${id}.png`;

export const GUNZSCAN_NODE_URL = (id) =>
  `https://gunzscan.io/token/0xc386fc39680D76Bc8F6Eba12513CF572910BB919/instance/${id}`;

export const GUNZ_RPC_URL = 'https://rpc.gunzchain.io/ext/bc/2M47TxWHGnhNtq6pM5zPXdATBtuqubxn5EPFgFmEawCQr9WFML/rpc';

export const GUNZ_LICENSE_CONTRACT = '0xc386fc39680D76Bc8F6Eba12513CF572910BB919';
export const GUNZ_GAME_ITEM_CONTRACT = '0x9ED98e159BE43a8d42b64053831FCAE5e4d7d271';
export const GUNZSCAN_ITEM_URL = (id) =>
  `https://gunzscan.io/token/0x9ED98e159BE43a8d42b64053831FCAE5e4d7d271/instance/${id}`;
