// src/config/contract.js
import PrescriptionRegistryABI from "./PrescriptionRegistry.json";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const CONTRACT_ABI = PrescriptionRegistryABI.abi || PrescriptionRegistryABI;

// Sepolia chain ID
export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

export const NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: "Sepolia Test Network",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"], // Replace with your own Infura/Alchemy key or use MetaMask provider directly
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};




// // Paste ABI here once contract is compiled // 
// // ABI is found at: artifacts/contracts/PrescriptionRegistry.sol/PrescriptionRegistry.json 
// // export const CONTRACT_ADDRESS = ""; // Fill in after deployment 
// // export const CONTRACT_ABI = []; // Fill in after "npx hardhat compile" is executed