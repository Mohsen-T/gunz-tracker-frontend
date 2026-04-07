import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'gridzilla_wallet';
const SIG_MESSAGE = 'Welcome to GRIDZILLA Marketplace!\n\nSign this message to verify your wallet ownership.\n\nThis does not cost any gas fees.';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Restore session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.address && saved?.signed) {
        setAddress(saved.address);
        setProvider(saved.provider);
        setSigned(true);
      }
    } catch {}
  }, []);

  // Fetch balance when connected
  useEffect(() => {
    if (!address || !signed) { setBalance(null); return; }
    let cancelled = false;
    const fetchBal = async () => {
      try {
        const { getBalance } = await import('../services/marketplace');
        const bal = await getBalance(address);
        if (!cancelled) setBalance(bal);
      } catch {
        if (!cancelled) setBalance(null);
      }
    };
    fetchBal();
    const interval = setInterval(fetchBal, 30000); // refresh every 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, [address, signed]);

  // Fetch unread notification count when connected
  useEffect(() => {
    if (!address || !signed) { setUnreadNotifications(0); return; }
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const { fetchNotifications } = await import('../services/api');
        const data = await fetchNotifications(address, { limit: 1 });
        if (!cancelled) setUnreadNotifications(data.unreadCount || 0);
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [address, signed]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (address && accounts[0].toLowerCase() !== address.toLowerCase()) {
        setAddress(accounts[0].toLowerCase());
        setSigned(false);
        setBalance(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [address]);

  const connectMetaMask = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected. Please install MetaMask.');
      return null;
    }
    setConnecting(true);
    setError(null);
    try {
      // wallet_requestPermissions opens MetaMask's account picker
      // so users can choose which account to connect
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permErr) {
        // Older wallets may not support wallet_requestPermissions — fall through
        if (permErr.code === 4001) throw permErr; // user rejected
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0].toLowerCase();
      setAddress(addr);
      setProvider('metamask');
      setSigned(false); // require fresh signature when account changes
      localStorage.removeItem(STORAGE_KEY);
      setConnecting(false);
      return addr;
    } catch (err) {
      setError(err.code === 4001 ? 'Connection rejected' : (err.message || 'Failed to connect MetaMask'));
      setConnecting(false);
      return null;
    }
  }, []);

  const requestSignature = useCallback(async () => {
    if (!address) return false;
    setError(null);
    try {
      const eth = window.ethereum;
      if (!eth) throw new Error('No wallet provider');
      await eth.request({ method: 'personal_sign', params: [SIG_MESSAGE, address] });
      setSigned(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ address, provider, signed: true }));
      return true;
    } catch (err) {
      setError(err.code === 4001 ? 'Signature rejected' : (err.message || 'Signature failed'));
      return false;
    }
  }, [address, provider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigned(false);
    setError(null);
    setBalance(null);
    setUnreadNotifications(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadNotifications(0);
  }, []);

  return {
    address, provider, connecting, signed, error, balance, unreadNotifications,
    isConnected: !!address && signed,
    connectMetaMask, requestSignature, disconnect, clearUnread,
    SIG_MESSAGE,
  };
}
