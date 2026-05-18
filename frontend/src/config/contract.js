// src/config/contract.js
import PrescriptionRegistryABI from "./PrescriptionRegistryABI.json";

export const CONTRACT_ADDRESS = "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE";

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
  rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};



// // Paste ABI here once contract is compiled
// // ABI is found at: artifacts/contracts/PrescriptionRegistry.sol/PrescriptionRegistry.json

// export const CONTRACT_ADDRESS = ""; // Fill in after deployment

// export const CONTRACT_ABI = []; // Fill in after "npx hardhat compile" is executed