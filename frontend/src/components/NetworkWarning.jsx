import { useState } from "react";
import { AlertTriangle, ArrowLeftRight, FlaskConical, X } from "lucide-react";
import useWallet from "../hooks/useWallet";
import { SEPOLIA_CHAIN_ID } from "../config/contract";

export default function NetworkWarning() {
  const { account, isWrongNetwork, isTestNetwork } = useWallet();
  const [dismissedWrong, setDismissedWrong] = useState(false);
  const [dismissedTest, setDismissedTest]   = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!account) return null;

  const handleSwitch = async () => {
    if (!window.ethereum) return;
    setSwitching(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
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
          // User rejected adding the network
        }
      }
    } finally {
      setSwitching(false);
    }
  };

  if (isWrongNetwork && !dismissedWrong) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm animate-slide-up">
        <div className="relative overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">
              <AlertTriangle size={16} className="text-red-500" />
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800">Wrong Network</p>
              <p className="mt-0.5 text-sm text-red-700">
                This app runs on Sepolia Testnet. Switch to continue.
              </p>
              <button
                onClick={handleSwitch}
                disabled={switching}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeftRight size={13} />
                {switching ? "Switching..." : "Switch to Sepolia"}
              </button>
            </div>

            <button
              onClick={() => setDismissedWrong(true)}
              title="Dismiss"
              className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isTestNetwork && !dismissedTest) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm animate-slide-up">
        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">
              <FlaskConical size={16} className="text-amber-500" />
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">Test Network</p>
              <p className="mt-0.5 text-sm text-amber-700">
                You're on a local test network. Switch to Sepolia to use the deployed contracts.
              </p>
              <button
                onClick={handleSwitch}
                disabled={switching}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeftRight size={13} />
                {switching ? "Switching..." : "Switch to Sepolia"}
              </button>
            </div>

            <button
              onClick={() => setDismissedTest(true)}
              title="Dismiss"
              className="shrink-0 rounded p-0.5 text-amber-400 transition-colors hover:bg-amber-100 hover:text-amber-700"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
