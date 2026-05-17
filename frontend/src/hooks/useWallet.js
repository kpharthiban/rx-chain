import { useState, useEffect, useCallback } from "react";

/**
 * useWallet
 * Manages MetaMask wallet connection, account state, and network detection.
 *
 * Returns:
 *  - account        : connected wallet address (null if not connected)
 *  - chainId        : current network chain ID
 *  - isConnecting   : true while waiting for MetaMask to respond
 *  - error          : error message string if something went wrong
 *  - connectWallet  : function to trigger MetaMask connection
 *  - disconnectWallet: function to clear local wallet state
 */
const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Check if MetaMask is installed (window.ethereum exists)

  // TODO: On mount, check if a wallet is already connected (eth_accounts)
  //       and set account + chainId from the existing session
  useEffect(() => {
    // TODO: implement auto-reconnect on page load
  }, []);

  // TODO: Listen for MetaMask account changes (accountsChanged event)
  //       Update account state or clear it if user disconnects in MetaMask
  useEffect(() => {
    // TODO: window.ethereum.on("accountsChanged", handler)
    // TODO: return cleanup — window.ethereum.removeListener(...)
  }, []);

  // TODO: Listen for MetaMask network/chain changes (chainChanged event)
  //       Update chainId state; optionally reload the page (MetaMask recommends this)
  useEffect(() => {
    // TODO: window.ethereum.on("chainChanged", handler)
    // TODO: return cleanup — window.ethereum.removeListener(...)
  }, []);

  /**
   * connectWallet
   * Prompts MetaMask to connect and stores the returned account address.
   */
  const connectWallet = useCallback(async () => {
    // TODO: setIsConnecting(true), clear previous error
    // TODO: call window.ethereum.request({ method: "eth_requestAccounts" })
    // TODO: get chainId via window.ethereum.request({ method: "eth_chainId" })
    // TODO: setAccount and setChainId on success
    // TODO: catch errors (user rejected, MetaMask not installed) and setError
    // TODO: setIsConnecting(false) in finally block
  }, []);

  /**
   * disconnectWallet
   * Clears local wallet state (MetaMask does not support programmatic disconnect).
   */
  const disconnectWallet = useCallback(() => {
    // TODO: setAccount(null), setChainId(null), setError(null)
  }, []);

  return {
    account,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
};

export default useWallet;
