import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import useWallet from "../hooks/useWallet";
import { SEPOLIA_CHAIN_ID } from "../config/contract";

/**
 * NetworkWarning
 * Renders a sticky banner below the navbar when the user's wallet
 * is connected but on the wrong network.
 *
 * Provides a one-click "Switch to Sepolia" button that triggers
 * MetaMask's network-switch prompt automatically.
 *
 * Returns null when the network is correct or no wallet is connected.
 */
export default function NetworkWarning() {
  const { account, isWrongNetwork } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  // Nothing to show if wallet isn't connected, or network is fine, or user dismissed
  if (!account || !isWrongNetwork || dismissed) return null;

  const handleSwitch = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      // Error code 4902 means the chain hasn't been added to MetaMask yet
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Test Network",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch {
          // User rejected adding the network — do nothing
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-medium text-red-700">
        <AlertTriangle size={15} className="shrink-0" />
        <span>
          Wrong network detected.{" "}
          <button
            onClick={handleSwitch}
            className="underline underline-offset-2 hover:text-red-900"
          >
            Switch to Sepolia Testnet
          </button>
        </span>
      </div>

      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
      >
        <X size={15} />
      </button>
    </div>
  );
}
