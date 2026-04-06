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
import WalletPanel from './components/WalletPanel';
import ProfilePage from './components/ProfilePage';

export default function App() {
  const [page, setPage] = useState('home');
  const [walletAddress, setWalletAddress] = useState(null);
  const isMobile = useIsMobile();
  const wallet = useWallet();

  const { nodes, loading: nodesLoading, error: nodesError, lastUpdated } = useNodes();
  const { stats, hexes, hashpower } = useStats();

  // UI state
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ rarity: [], status: 'all' });
  const [view, setView] = useState('bubbles');
  const [showSidebar, setShowSidebar] = useState(false);

  /**
   * activeOverlay: dropdowns/modals — only one at a time.
   * Values: null | 'notifications' | 'accountMenu' | 'walletPanel' | 'connectWallet' | 'createListing'
   *
   * profileView: separate from overlays so dropdowns don't close the profile page.
   * Values: null | 'profile' | 'listings' | 'offers' | 'favorites' | 'settings'
   */
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [profileView, setProfileView] = useState(null);

  const closeAllOverlays = useCallback(() => setActiveOverlay(null), []);

  const PROFILE_VIEWS = ['profile', 'listings', 'offers', 'favorites', 'settings'];

  const handleSetOverlay = useCallback((overlay) => {
    // Profile-related targets open the profile page, not an overlay
    if (PROFILE_VIEWS.includes(overlay)) {
      setProfileView(overlay);
      setActiveOverlay(null); // close any dropdown
      return;
    }
    // Toggle dropdown overlay
    setActiveOverlay(prev => prev === overlay ? null : overlay);
  }, []);

  const showConnectWallet = activeOverlay === 'connectWallet';
  const showCreateListing = activeOverlay === 'createListing';
  const showWalletPanel = activeOverlay === 'walletPanel';
  const showProfilePage = !!profileView;
  const profileTab = profileView || 'collected';

  const filtered = useMemo(() => {
    let f = nodes;
    if (filters.rarity.length > 0) f = f.filter(n => filters.rarity.includes(n.rarity));
    if (filters.status !== 'all') f = f.filter(n => n.activity === filters.status);
    if (search) {
      const q = search.toLowerCase();
      const isNumeric = /^\d+$/.test(q);
      f = f.filter(n => {
        const sid = String(n.id);
        if (isNumeric) return sid === q || sid.startsWith(q);
        return sid.includes(q) || (n.hackerWalletAddress && n.hackerWalletAddress.toLowerCase().includes(q));
      });
    }
    return f;
  }, [nodes, filters, search]);

  const handleSelect = useCallback((node) => {
    setSelected(node);
    closeAllOverlays();
    setProfileView(null);
    if (page === 'wallet') { setPage('app'); setWalletAddress(null); }
  }, [page, closeAllOverlays]);

  const handleOpenWallet = useCallback((address) => {
    setWalletAddress(address); setPage('wallet'); setSelected(null); closeAllOverlays(); setProfileView(null);
  }, [closeAllOverlays]);

  const handleNavigate = useCallback((target) => {
    setPage(target); setSelected(null); closeAllOverlays(); setProfileView(null);
    if (target !== 'wallet') setWalletAddress(null);
  }, [closeAllOverlays]);

  const handleConnectWallet = useCallback(() => {
    setActiveOverlay('connectWallet');
  }, []);

  const handleOpenCreateListing = useCallback(() => {
    if (wallet.isConnected) setActiveOverlay('createListing');
    else setActiveOverlay('connectWallet');
  }, [wallet.isConnected]);

  // Homepage
  if (page === 'home') return <HomePage onLaunch={() => setPage('app')} />;

  // Wallet page (tracker)
  if (page === 'wallet' && walletAddress) {
    return <WalletPage address={walletAddress} onBack={() => { setPage('app'); setWalletAddress(null); }} onSelectNode={handleSelect} />;
  }

  // Loading (tracker only)
  if (page === 'app' && nodesLoading && nodes.length === 0) return <LoadingScreen error={nodesError} />;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#040804', color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Header
        filteredCount={filtered.length} stats={stats} lastUpdated={lastUpdated}
        isMobile={isMobile} onNavigate={handleNavigate} currentPage={page}
        wallet={wallet} onConnectWallet={handleConnectWallet}
        activeOverlay={activeOverlay} onSetOverlay={handleSetOverlay}
      />

      {/* Profile page (from account menu) */}
      {showProfilePage && wallet.isConnected ? (
        <ProfilePage
          wallet={wallet} isMobile={isMobile}
          onClose={() => setProfileView(null)}
          onSelectNode={(node) => { handleSelect(node); setPage('app'); }}
          initialTab={profileTab}
        />
      ) : page === 'marketplace' ? (
        <MarketplacePage
          onSelectNode={(node) => { setSelected(node); setPage('app'); }}
          isMobile={isMobile} wallet={wallet}
          onConnectWallet={() => setActiveOverlay('connectWallet')}
          onOpenCreateListing={handleOpenCreateListing}
        />
      ) : (
        <>
          <Controls
            search={search} onSearch={setSearch} filters={filters} onFilters={setFilters}
            view={view} onView={setView} activityCounts={stats?.activity || null}
            onReset={() => { setSearch(''); setFilters({ rarity: [], status: 'all' }); setView('bubbles'); setSelected(null); }}
            isMobile={isMobile} onToggleSidebar={() => setShowSidebar(s => !s)}
          />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {view === 'bubbles'
                ? <BubbleCanvas nodes={filtered} onSelect={handleSelect} selectedId={selected?.id} />
                : <Leaderboard nodes={filtered} onSelect={handleSelect} isMobile={isMobile} />}
              {selected && (
                <DetailPanel node={selected} onClose={() => setSelected(null)} onSelect={handleSelect}
                  onOpenWallet={handleOpenWallet} onFilterOwner={(a) => { setSearch(a); setView('bubbles'); }} isMobile={isMobile} />
              )}
            </div>
            {(!isMobile || showSidebar) && (
              <Sidebar stats={stats} hexes={hexes} hashpower={hashpower} nodes={nodes}
                isMobile={isMobile} onClose={() => setShowSidebar(false)} onSelectNode={handleSelect} />
            )}
          </div>
          <Footer lastUpdated={lastUpdated} isMobile={isMobile} />
        </>
      )}

      {/* ── Full-screen overlays ── */}
      {showConnectWallet && (
        <ConnectWalletModal wallet={wallet} isMobile={isMobile}
          onClose={closeAllOverlays} onConnect={closeAllOverlays} />
      )}
      {showCreateListing && wallet.isConnected && (
        <CreateListing onClose={closeAllOverlays} isMobile={isMobile} walletAddress={wallet.address} />
      )}
      {showWalletPanel && wallet.isConnected && (
        <WalletPanel wallet={wallet} isMobile={isMobile}
          onClose={closeAllOverlays}
          onNavigateProfile={() => { setProfileView('profile'); closeAllOverlays(); }} />
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
