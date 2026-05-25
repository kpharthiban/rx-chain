import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

const useRoles = (account) => {
  const [isDoctor, setIsDoctor] = useState(false);
  const [isPharmacist, setIsPharmacist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!account || !window.ethereum) {
      setIsDoctor(false);
      setIsPharmacist(false);
      return;
    }

    if (
      !CONTRACT_ADDRESS ||
      CONTRACT_ADDRESS === "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE" ||
      !CONTRACT_ABI ||
      CONTRACT_ABI.length === 0
    ) {
      setIsDoctor(false);
      setIsPharmacist(false);
      return;
    }

    const checkRoles = async () => {
      try {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const [doctor, pharmacy] = await Promise.all([
          contract.verifiedDoctors(account),
          contract.verifiedPharmacies(account),
        ]);

        setIsDoctor(doctor);
        setIsPharmacist(pharmacy);
      } catch {
        setIsDoctor(false);
        setIsPharmacist(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoles();
  }, [account]);

  return { isDoctor, isPharmacist, isLoading };
};

export default useRoles;
