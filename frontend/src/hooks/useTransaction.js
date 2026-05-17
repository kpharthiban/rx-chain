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
    // TODO: setLoading(true), clear previous error/txHash/receipt
    // TODO: call await contractCall() — this returns a TransactionResponse
    // TODO: setTxHash(tx.hash) immediately after broadcast
    // TODO: await tx.wait() to get the TransactionReceipt (waits for mining)
    // TODO: setReceipt(receipt) on success
    // TODO: catch errors:
    //         - user rejected (error.code === 4001 or ACTION_REJECTED) → friendly message
    //         - insufficient gas → friendly message
    //         - contract revert → parse error.reason or error.data
    //         - fallback → setError(error.message)
    // TODO: setLoading(false) in finally block
  }, []);

  /**
   * reset
   * Clears all state — useful before initiating a new transaction
   * or when the component unmounts.
   */
  const reset = useCallback(() => {
    // TODO: setLoading(false), setError(null), setTxHash(null), setReceipt(null)
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
