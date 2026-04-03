import { useState, useCallback, useEffect } from 'react';
import { GUNZ_RPC_URL } from '../utils/constants';

/**
 * Wallet connection hook.
 * Manages connect/disconnect, account state, and signature verification.
 *
 * Flow (OpenSea-style):
 *   1. User clicks "Connect Wallet"
 *   2. ConnectWalletModal opens — choose provider (MetaMask, WalletConnect, etc.)
 *   3. Provider connects → account address obtained
 *   4. WelcomeModal opens — agree to TOS/Privacy
 *   5. Signature request sent to wallet for verification
 *   6. Once signed → fully connected
 */

const STORAGE_KEY = 'gridzilla_wallet';
const SIG_MESSAGE = 'Welcome to GRIDZILLA Marketplace!\n\nSign this message to verify your wallet ownership.\n\nThis does not cost any gas fees.';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null); // 'metamask' | 'walletconnect' | null
  const [connecting, setConnecting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState(null);

  // Restore session from localStorage
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

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (address && accounts[0].toLowerCase() !== address.toLowerCase()) {
        // Account switched — reset signature
        setAddress(accounts[0].toLowerCase());
        setSigned(false);
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
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0].toLowerCase();
      setAddress(addr);
      setProvider('metamask');
      setConnecting(false);
      return addr;
    } catch (err) {
      setError(err.message || 'Failed to connect MetaMask');
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
      await eth.request({
        method: 'personal_sign',
        params: [SIG_MESSAGE, address],
      });
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    address,
    provider,
    connecting,
    signed,
    error,
    isConnected: !!address && signed,
    connectMetaMask,
    requestSignature,
    disconnect,
    SIG_MESSAGE,
  };
}
