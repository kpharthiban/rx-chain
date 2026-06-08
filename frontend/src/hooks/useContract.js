import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import useWallet from "./useWallet";

/**
 * useContract
 * Creates and returns an ethers.js contract instance connected to the
 * deployed PrescriptionRegistry smart contract.
 *
 * Depends on useWallet — re-initialises whenever the connected account changes.
 *
 * Returns:
 *  - contract       : ethers.js Contract instance (null until wallet is connected)
 *  - isReady        : true once the contract instance is successfully created
 *  - error          : error message string if initialisation failed
 */
const useContract = () => {
  const { account } = useWallet();
  const [contract, setContract] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state whenever the account changes
    setContract(null);
    setIsReady(false);
    setError(null);

    // Guard: wallet not connected yet
    if (!account) return;

    // Guard: MetaMask not available
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    // Guard: contract not yet deployed (address is still the placeholder)
    if (
      !CONTRACT_ADDRESS ||
      CONTRACT_ADDRESS === "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE"
    ) {
      setError("Contract not deployed yet — update CONTRACT_ADDRESS in config/contract.js.");
      return;
    }

    const initContract = async () => {
      try {
        // ethers v5 — Web3Provider wraps window.ethereum
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        setContract(instance);
        setIsReady(true);
      } catch (err) {
        setError("Failed to initialise contract: " + err.message);
      }
    };

    initContract();
  }, [account]); // Re-run whenever the connected wallet changes

  return {
    contract,
    isReady,
    error,
  };
};

export default useContract;
