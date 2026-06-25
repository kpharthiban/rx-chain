import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const PROD_CHAIN_IDS = ["0xaa36a7"];          // Sepolia
const TEST_CHAIN_IDS = ["0x7a69", "0x539"];  // Hardhat local, Ganache
const ALL_ACCEPTED_IDS = [...PROD_CHAIN_IDS, ...TEST_CHAIN_IDS];

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTestNetwork  = !!(account && chainId && TEST_CHAIN_IDS.includes(chainId));
  const isWrongNetwork = !!(account && chainId && !ALL_ACCEPTED_IDS.includes(chainId));

  const setupProvider = useCallback(() => {
    if (!window.ethereum) return null;

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    return web3Provider;
  }, []);

  useEffect(() => {
    if (!window.ethereum) {
      setWalletLoading(false);
      return;
    }

    async function loadExistingWallet() {
      if (sessionStorage.getItem("rxchain-disconnected") === "true") {
        setWalletLoading(false);
        return;
      }

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
      } finally {
        setWalletLoading(false);
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
        sessionStorage.removeItem("rxchain-disconnected");
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
      sessionStorage.removeItem("rxchain-disconnected");

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
    sessionStorage.setItem("rxchain-disconnected", "true");
  }, []);

  const getRoleRedirectPath = useCallback((role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "doctor":
        return "/doctor";
      case "pharmacy":
        return "/pharmacist";
      default:
        return "/patient";
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        isConnecting,
        isTestNetwork,
        isWrongNetwork,
        error,
        walletLoading,
        connectWallet,
        disconnectWallet,
        getRoleRedirectPath,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used inside WalletProvider");
  }
  return ctx;
}
