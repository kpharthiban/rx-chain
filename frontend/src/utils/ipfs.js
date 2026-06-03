// src/utils/ipfs.js

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

/**
 * Uploads prescription data to IPFS through Pinata.
 * Returns the CID and gateway URL.
 */
export async function uploadPrescriptionToIPFS(prescriptionData) {
  try {
    if (!PINATA_JWT || PINATA_JWT.includes("PASTE")) {
      throw new Error("Pinata JWT is missing. Please check frontend/.env.");
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataMetadata: {
          name: `prescription-${Date.now()}`,
        },
        pinataContent: prescriptionData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${errorText}`);
    }

    const result = await response.json();

    return {
      cid: result.IpfsHash,
      url: `${PINATA_GATEWAY}${result.IpfsHash}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(error.message || "Failed to upload prescription to IPFS.");
  }
}

/**
 * Fetches prescription data from IPFS by CID.
 */
export async function fetchPrescriptionFromIPFS(cid) {
  try {
    if (!cid) {
      throw new Error("IPFS CID is required.");
    }

    const response = await fetch(`${PINATA_GATEWAY}${cid}`);

    if (!response.ok) {
      throw new Error("Unable to fetch prescription data from IPFS.");
    }

    return await response.json();
  } catch (error) {
    console.error("IPFS fetch error:", error);
    throw new Error(error.message || "Failed to fetch prescription from IPFS.");
  }
}