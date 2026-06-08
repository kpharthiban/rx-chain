// src/utils/detectRole.js
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

/**
 * Creates a contract instance using the connected MetaMask provider.
 */
export function getContract(provider) {
  if (!provider) {
    throw new Error("Provider is missing.");
  }

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.includes("PASTE")) {
    throw new Error("Contract address is not configured.");
  }

  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Detects the connected wallet role from the smart contract.
 *
 * Possible return values:
 * admin, doctor, pharmacy, patient, unregistered
 */
export async function detectRole(contract, account) {
  try {
    if (!contract || !account) {
      return "unregistered";
    }

    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const doctorRole = await contract.DOCTOR_ROLE();
    const pharmacyRole = await contract.PHARMACY_ROLE();

    const isAdmin = await contract.hasRole(adminRole, account);
    if (isAdmin) return "admin";

    const isDoctor = await contract.hasRole(doctorRole, account);
    if (isDoctor) return "doctor";

    const isPharmacy = await contract.hasRole(pharmacyRole, account);
    if (isPharmacy) return "pharmacy";

    return "patient";
  } catch (error) {
    console.error("Role detection error:", error);
    return "unregistered";
  }
}