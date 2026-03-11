# GRIDZILLA Frontend

Real-time bubble map visualization and analytics dashboard for all 10,000 GUNZ Hacker License NFTs. Mobile responsive.

**Live:** [gridzilla.io](https://gridzilla.io)

## Features

- **Animated Homepage** - Landing page with live stats preview and "Launch App" entry
- **Bubble Map** - 10,000 animated bubbles sized by hashpower, colored by rarity
  - Common: simple fill (performance optimized for ~9K nodes)
  - Rare: double ring outline
  - Epic: dashed outline
  - Legendary: pulsing glow animation
  - Ancient: outer halo ring
- **Node Detail Panel** - Click any bubble for full stats
  - Node NFT image with loading spinner + placeholder
  - Stats grid: hexes, hashpower, GUN earned, capacity, distribution, activity
  - GUN Earnings chart (7D / 30D / 90D) from on-chain Decoded events
  - Decoded Items chart with period selector
  - Game Items grid with images, rarity, class (traced from on-chain data)
  - Owner wallet link, "Portfolio" button to filter bubbles by owner
  - GunzScan link for on-chain verification
- **Wallet Explorer** - Dedicated page showing all nodes owned by a wallet
  - Summary stats (total nodes, active, hexes, hashpower)
  - Rarity breakdown badges
  - Lazy-loaded node card grid with images (batches of 30)
- **Leaderboard** - Sortable table with pagination (25/page)
  - Sort by hexes, hashpower, distribution rate
  - Mobile: card layout with compact sort controls
- **Controls** - Search (ID prefix or wallet), rarity filters, status toggle (All/Active/Inactive), reset button
- **Ecosystem Stats** (Sidebar) - Daily HEX chart, hashpower trend, rarity breakdown, top 20 movers
- **Live Decode Feed** (Sidebar) - Simulated recent decode events
- **Auto-refresh** - Polls backend every 2 minutes
- **Mobile Responsive** - Adaptive layouts for all components, touch-friendly controls

## Quick Start

```bash
# Prerequisites: Backend must be running on port 3001
# See ../gunz-tracker-backend/README.md

cd gunz-tracker-frontend
npm install
npm run dev
# Opens http://localhost:5173
```

## Production Build

```bash
npm run build
# Output in dist/

# If backend is on a different domain:
VITE_API_URL=https://api.gridzilla.io npm run build
```

## Deployment

The frontend builds to static files in `dist/`. Serve with Nginx:

```nginx
server {
    listen 80;
    server_name gridzilla.io www.gridzilla.io;

    root /path/to/gunz-tracker-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Add HTTPS:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d gridzilla.io -d www.gridzilla.io
```

## Project Structure

```
src/
|-- App.jsx                 # Page routing (home/app/wallet), state, filters
|-- main.jsx                # React entry point
|-- components/
|   |-- HomePage.jsx        # Animated landing with stats + "Launch App"
|   |-- BubbleCanvas.jsx    # Canvas-based 10K bubble renderer
|   |-- DetailPanel.jsx     # Node detail: stats, charts, items, owner
|   |-- WalletPage.jsx      # Wallet explorer with lazy-loaded node cards
|   |-- Controls.jsx        # Search, rarity/status filters, reset, view toggle
|   |-- Header.jsx          # Logo + global stat counters
|   |-- Leaderboard.jsx     # Paginated sortable table (25/page)
|   |-- Sidebar.jsx         # Stats tab + Live decode feed tab
|   |-- Footer.jsx          # Version, donation, LIVE indicator
|   |-- LoadingScreen.jsx   # Initial loading state
|-- hooks/
|   |-- useNodes.js         # Fetches all 10K nodes with 2-min polling
|   |-- useStats.js         # Fetches global stats with 2-min polling
|   |-- useIsMobile.js      # Responsive breakpoint hook (768px)
|-- services/
|   |-- api.js              # All backend API calls
|-- utils/
    |-- constants.js        # Rarity config, colors, contracts, URLs
    |-- format.js           # Number/address/time formatting helpers
```

## Page Routing

State-based routing (no React Router):

| State | Component | Description |
|-------|-----------|-------------|
| `home` | HomePage | Animated landing page |
| `app` | BubbleCanvas + Controls + Sidebar + DetailPanel | Main dashboard |
| `wallet` | WalletPage | Wallet node explorer |

## Search Behavior

- **Numeric input** (e.g. `4`, `901`): Matches node IDs by exact match or prefix (`startsWith`)
- **Hex/text input** (e.g. `0x27...`): Matches wallet addresses by `includes`
- Search clears with the Reset button

## Performance

- **Canvas fast-path**: Common nodes (~90%) use simple `arc + fill` (no stroke, text, or gradients)
- **Pre-computed styles**: Per-bubble colors and flags calculated once per data update, not per frame
- **Lazy loading**: WalletPage renders cards in batches of 30 via IntersectionObserver
- **Image loading**: `loading="lazy"` on all node/item images with spinner placeholders
- **Pagination**: Leaderboard renders 25 rows per page instead of all 10K

## External Resources

| Resource | URL Pattern |
|----------|------------|
| Node Images | `hacker-images.fra1.digitaloceanspaces.com/licenses/{id}.png` |
| Game Item Images | `cdne-g01-livepc-wu-itemsthumbnails.azureedge.net/...` |
| GunzScan Node | `gunzscan.io/token/0xc386.../instance/{id}` |
| GunzScan Item | `gunzscan.io/token/0x9ED9.../instance/{id}` |

## Tech Stack

- **Framework:** React 18 (Vite)
- **Rendering:** HTML5 Canvas (bubble map), inline styles (no CSS framework)
- **State:** React hooks (`useState`, `useMemo`, `useCallback`)
- **Build:** Vite 5
