import { useState, useMemo, useCallback } from 'react';
import { useNodes } from './hooks/useNodes';
import { useStats } from './hooks/useStats';
import { useIsMobile } from './hooks/useIsMobile';
import { useWallet } from './hooks/useWallet';
import Header from './components/Header';
import Controls from './components/Controls';
import BubbleCanvas from './components/BubbleCanvas';
import Leaderboard from './components/Leaderboard';
import DetailPanel from './components/DetailPanel';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './components/HomePage';
import WalletPage from './components/WalletPage';
import MarketplacePage from './components/MarketplacePage';
import ConnectWalletModal from './components/ConnectWalletModal';
import CreateListing from './components/CreateListing';

export default function App() {
  const [page, setPage] = useState('home');
  const [walletAddress, setWalletAddress] = useState(null);
  const isMobile = useIsMobile();
  const wallet = useWallet();

  // Data hooks — fetch from backend API with 2-min polling
  const { nodes, loading: nodesLoading, error: nodesError, lastUpdated } = useNodes();
  const { stats, hexes, hashpower, loading: statsLoading } = useStats();

  // UI state
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ rarity: [], status: 'all' });
  const [view, setView] = useState('bubbles');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Filter nodes
  const filtered = useMemo(() => {
    let f = nodes;
    if (filters.rarity.length > 0) {
      f = f.filter(n => filters.rarity.includes(n.rarity));
    }
    if (filters.status !== 'all') {
      f = f.filter(n => n.activity === filters.status);
    }
    if (search) {
      const q = search.toLowerCase();
      const isNumeric = /^\d+$/.test(q);
      f = f.filter(n => {
        const sid = String(n.id);
        if (isNumeric) {
          return sid === q || sid.startsWith(q);
        }
        return sid.includes(q) ||
          (n.hackerWalletAddress && n.hackerWalletAddress.toLowerCase().includes(q));
      });
    }
    return f;
  }, [nodes, filters, search]);

  const activityCounts = stats?.activity || null;

  const handleSelect = useCallback((node) => {
    setSelected(node);
    if (page === 'wallet') {
      setPage('app');
      setWalletAddress(null);
    }
  }, [page]);

  const handleOpenWallet = useCallback((address) => {
    setWalletAddress(address);
    setPage('wallet');
    setSelected(null);
  }, []);

  const handleFilterOwner = useCallback((address) => {
    setSearch(address);
    setView('bubbles');
  }, []);

  const handleReset = useCallback(() => {
    setSearch('');
    setFilters({ rarity: [], status: 'all' });
    setView('bubbles');
    setSelected(null);
  }, []);

  const handleNavigate = useCallback((target) => {
    setPage(target);
    setSelected(null);
    setShowCreateListing(false);
    if (target !== 'wallet') setWalletAddress(null);
  }, []);

  const handleConnectWallet = useCallback(() => {
    if (wallet.isConnected) {
      // Already connected — open list flow directly
      setShowCreateListing(true);
    } else {
      setShowConnectWallet(true);
    }
  }, [wallet.isConnected]);

  const handleWalletConnected = useCallback(() => {
    setShowConnectWallet(false);
  }, []);

  // Homepage
  if (page === 'home') {
    return <HomePage onLaunch={() => setPage('app')} />;
  }

  // Wallet page
  if (page === 'wallet' && walletAddress) {
    return (
      <WalletPage
        address={walletAddress}
        onBack={() => { setPage('app'); setWalletAddress(null); }}
        onSelectNode={handleSelect}
      />
    );
  }

  // Loading state (only block tracker, not marketplace)
  if (page === 'app' && nodesLoading && nodes.length === 0) {
    return <LoadingScreen error={nodesError} />;
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#040804', color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Header
        filteredCount={filtered.length}
        stats={stats}
        lastUpdated={lastUpdated}
        isMobile={isMobile}
        onNavigate={handleNavigate}
        currentPage={page}
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
      />

      {page === 'marketplace' ? (
        <MarketplacePage
          onSelectNode={(node) => { setSelected(node); setPage('app'); }}
          isMobile={isMobile}
          wallet={wallet}
          onConnectWallet={() => setShowConnectWallet(true)}
          showCreateListing={showCreateListing}
          onCloseCreateListing={() => setShowCreateListing(false)}
          onOpenCreateListing={() => {
            if (wallet.isConnected) setShowCreateListing(true);
            else setShowConnectWallet(true);
          }}
        />
      ) : (
        <>
          <Controls
            search={search}
            onSearch={setSearch}
            filters={filters}
            onFilters={setFilters}
            view={view}
            onView={setView}
            activityCounts={activityCounts}
            onReset={handleReset}
            isMobile={isMobile}
            onToggleSidebar={() => setShowSidebar(s => !s)}
          />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {view === 'bubbles' ? (
                <BubbleCanvas nodes={filtered} onSelect={handleSelect} selectedId={selected?.id} />
              ) : (
                <Leaderboard nodes={filtered} onSelect={handleSelect} isMobile={isMobile} />
              )}
              {selected && (
                <DetailPanel
                  node={selected}
                  onClose={() => setSelected(null)}
                  onSelect={handleSelect}
                  onOpenWallet={handleOpenWallet}
                  onFilterOwner={handleFilterOwner}
                  isMobile={isMobile}
                />
              )}
            </div>
            {(!isMobile || showSidebar) && (
              <Sidebar
                stats={stats} hexes={hexes} hashpower={hashpower} nodes={nodes}
                isMobile={isMobile}
                onClose={() => setShowSidebar(false)}
                onSelectNode={handleSelect}
              />
            )}
          </div>
          <Footer lastUpdated={lastUpdated} isMobile={isMobile} />
        </>
      )}

      {/* Connect Wallet Modal */}
      {showConnectWallet && (
        <ConnectWalletModal
          wallet={wallet}
          isMobile={isMobile}
          onClose={() => setShowConnectWallet(false)}
          onConnect={handleWalletConnected}
        />
      )}

      {/* Create Listing Modal (requires connected wallet) */}
      {showCreateListing && wallet.isConnected && (
        <CreateListing
          onClose={() => setShowCreateListing(false)}
          isMobile={isMobile}
          walletAddress={wallet.address}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060b06; }
        ::-webkit-scrollbar-thumb { background: #1a2a1a; border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
