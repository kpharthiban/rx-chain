import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

/**
 * useContract
 * Creates and returns an ethers.js contract instance connected to the
 * deployed PrescriptionRegistry smart contract.
 *
 * Depends on useWallet — expects a connected signer from MetaMask.
 *
 * Returns:
 *  - contract       : ethers.js Contract instance (null until wallet is connected)
 *  - isReady        : true once the contract instance is successfully created
 *  - error          : error message string if initialisation failed
 */
const useContract = () => {
  const [contract, setContract] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Import ethers from "ethers" (v6) or "ethers/providers" depending on version used

  // TODO: On mount (or when wallet account changes), initialise the contract:
  //       1. Create a new ethers.BrowserProvider from window.ethereum
  //       2. Get the signer via provider.getSigner()
  //       3. Instantiate: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  //       4. setContract(instance), setIsReady(true)
  //       Handle case where CONTRACT_ADDRESS or CONTRACT_ABI is empty (not yet deployed)
  useEffect(() => {
    // TODO: implement contract initialisation
    // TODO: guard — if CONTRACT_ADDRESS is empty, setError and return early
    // TODO: guard — if window.ethereum is not available, setError and return early
  }, []); // TODO: add wallet account as a dependency once useWallet is integrated

  return {
    contract,
    isReady,
    error,
  };
};

export default useContract;
