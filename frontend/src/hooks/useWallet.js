import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isWrongNetwork = account && chainId && chainId !== SEPOLIA_CHAIN_ID;

  const setupProvider = useCallback(() => {
    if (!window.ethereum) return null;

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    return web3Provider;
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    async function loadExistingWallet() {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        const id = await window.ethereum.request({
          method: "eth_chainId",
        });

        setChainId(id);

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setupProvider();
        }
      } catch (err) {
        console.error("Failed to load wallet:", err);
      }
    }

    loadExistingWallet();
  }, [setupProvider]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
        setChainId(null);
      } else {
        setAccount(accounts[0]);
        setupProvider();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () =>
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, [setupProvider]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      setupProvider();
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    return () =>
      window.ethereum.removeListener("chainChanged", handleChainChanged);
  }, [setupProvider]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.");
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const id = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAccount(accounts[0]);
      setChainId(id);
      setupProvider();

      return accounts[0];
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the MetaMask request.");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }

      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [setupProvider]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setError(null);
  }, []);

  const getRoleRedirectPath = useCallback(() => {
    return "/patient";
  }, []);

  return {
    account,
    chainId,
    provider,
    isConnecting,
    isWrongNetwork,
    error,
    connectWallet,
    disconnectWallet,
    getRoleRedirectPath,
  };
};

export default useWallet;