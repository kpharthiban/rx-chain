import { useState, useCallback } from "react";

/**
 * useTransaction
 * A utility hook that wraps smart contract calls with unified
 * loading, error, and success state management.
 *
 * Prevents every page/component from duplicating try/catch logic,
 * pending spinners, and gas error handling.
 *
 * Returns:
 *  - loading        : true while a transaction is being sent/mined
 *  - error          : error message string if the transaction failed
 *  - txHash         : transaction hash string on success (null otherwise)
 *  - receipt        : full transaction receipt object on success (null otherwise)
 *  - sendTransaction: function to execute a contract call safely
 *  - reset          : function to clear state back to initial values
 */
const useTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [receipt, setReceipt] = useState(null);

  /**
   * sendTransaction
   * Accepts a callback that performs the actual contract call,
   * and manages state around it.
   *
   * Usage example (in a component):
   *   const { loading, error, txHash, sendTransaction } = useTransaction();
   *   await sendTransaction(() => contract.issuePrescription(...args));
   *
   * @param {Function} contractCall - An async function that calls the contract method
   */
  const sendTransaction = useCallback(async (contractCall) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    setReceipt(null);

    try {
      // contractCall() returns a TransactionResponse (broadcast, not yet mined)
      const tx = await contractCall();

      // Show the hash immediately so the UI can link to Etherscan
      setTxHash(tx.hash);

      // Wait for the transaction to be mined (returns TransactionReceipt)
      const txReceipt = await tx.wait();
      setReceipt(txReceipt);
    } catch (err) {
      // User clicked "Reject" in MetaMask
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected. You cancelled the MetaMask request.");
      }
      // Contract reverted with a require() message
      else if (err.reason) {
        setError("Transaction failed: " + err.reason);
      }
      // Insufficient funds / gas estimation failed
      else if (err.message && err.message.includes("insufficient funds")) {
        setError("Insufficient funds to cover gas. Top up your Sepolia ETH.");
      }
      // Fallback — show raw error message
      else {
        setError(err.message || "An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * reset
   * Clears all state — useful before initiating a new transaction
   * or when the component unmounts.
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTxHash(null);
    setReceipt(null);
  }, []);

  return {
    loading,
    error,
    txHash,
    receipt,
    sendTransaction,
    reset,
  };
};

export default useTransaction;
