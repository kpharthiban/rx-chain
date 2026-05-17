// src/hooks/useWallet.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "../config/contract";

export default function useWallet() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    setAccount(accounts[0]);
    setChainId(currentChainId);
    setProvider(new ethers.providers.Web3Provider(window.ethereum));
  };

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(new ethers.providers.Web3Provider(window.ethereum));
      }
    });

    window.ethereum.request({ method: "eth_chainId" }).then(setChainId);

    window.ethereum.on("accountsChanged", (accounts) => {
      setAccount(accounts[0] || "");
    });

    window.ethereum.on("chainChanged", (id) => {
      setChainId(id);
      window.location.reload();
    });
  }, []);

  const isWrongNetwork = chainId && chainId !== SEPOLIA_CHAIN_ID;

  return {
    account,
    chainId,
    provider,
    connectWallet,
    isWrongNetwork,
  };
}