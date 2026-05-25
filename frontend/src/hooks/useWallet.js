import { useState, useEffect, useCallback } from "react";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const ADMIN_WALLET = "0x0000000000000000000000000000000000000000";

const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isWrongNetwork = account && chainId && chainId !== SEPOLIA_CHAIN_ID;

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          return window.ethereum.request({ method: "eth_chainId" });
        }
      })
      .then((id) => {
        if (id) setChainId(id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setChainId(null);
      } else {
        setAccount(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () =>
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
    };

    window.ethereum.on("chainChanged", handleChainChanged);
    return () =>
      window.ethereum.removeListener("chainChanged", handleChainChanged);
  }, []);

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
      const id = await window.ethereum.request({ method: "eth_chainId" });

      setAccount(accounts[0]);
      setChainId(id);

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
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  const getRole = useCallback(() => {
    if (!account) return null;
    if (account.toLowerCase() === ADMIN_WALLET.toLowerCase()) return "admin";
    return "user";
  }, [account]);

  const getRoleRedirectPath = useCallback(() => {
    const role = getRole();
    if (role === "admin") return "/admin";
    return "/patient";
  }, [getRole]);

  return {
    account,
    chainId,
    isConnecting,
    isWrongNetwork,
    error,
    connectWallet,
    disconnectWallet,
    getRole,
    getRoleRedirectPath,
  };
};

export default useWallet;
