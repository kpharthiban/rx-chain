import { useState } from "react";
import { UserPlus, Building2, Wallet } from "lucide-react";

import Card from "../components/Card";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { uploadFileToIPFS } from "../utils/ipfs";

export default function Register() {
  const { account, provider, connectWallet } = useWallet();

  const [tab, setTab] = useState("doctor");
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    licenseNumber: "",
    specialization: "",
    supportingFile: null,
  });

  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    licenseNumber: "",
    address: "",
    supportingFile: null,
  });

  const handleDoctorChange = (e) => {
    const { name, value, files } = e.target;

    setDoctorForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handlePharmacyChange = (e) => {
    const { name, value, files } = e.target;

    setPharmacyForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!account) {
        throw new Error("Please connect your wallet first.");
      }

      if (!provider) {
        throw new Error("Wallet provider is not available. Please reconnect MetaMask.");
      }

      const form = tab === "doctor" ? doctorForm : pharmacyForm;

      if (!form.supportingFile) {
        throw new Error("Please upload a supporting document.");
      }

      setTxStatus("pending");
      setTxMessage("Uploading supporting document to IPFS...");

      const ipfsResult = await uploadFileToIPFS(form.supportingFile);

      setTxMessage("Document uploaded to IPFS. Please confirm transaction in MetaMask...");

      const contract = getContract(provider);

      let tx;

      if (tab === "doctor") {
        tx = await contract.requestDoctorRegistration(
          doctorForm.name,
          doctorForm.licenseNumber,
          ipfsResult.cid
        );
      } else {
        tx = await contract.requestPharmacyRegistration(
          pharmacyForm.name,
          pharmacyForm.licenseNumber,
          ipfsResult.cid
        );
      }

      setTxMessage("Transaction submitted. Waiting for blockchain confirmation...");

      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage(
        `${tab === "doctor" ? "Doctor" : "Pharmacy"} registration request submitted successfully. IPFS CID: ${ipfsResult.cid}`
      );

      if (tab === "doctor") {
        setDoctorForm({
          name: "",
          licenseNumber: "",
          specialization: "",
          supportingFile: null,
        });
      } else {
        setPharmacyForm({
          name: "",
          licenseNumber: "",
          address: "",
          supportingFile: null,
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setTxStatus("failed");
      setTxMessage(error.reason || error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Registration Request"
        subtitle="Submit your doctor or pharmacy verification request for admin approval."
        icon={<UserPlus size={22} />}
      />

      {!account && (
        <Card className="mb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Wallet size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Connect your wallet first
                </h3>
                <p className="text-sm text-slate-500">
                  Your wallet address will be used as your blockchain identity.
                </p>
              </div>
            </div>

            <Button onClick={connectWallet} size="sm">
              Connect Wallet
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1 sm:mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("doctor");
              setTxStatus(null);
              setTxMessage("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
              tab === "doctor"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus size={14} className="sm:hidden" />
            <UserPlus size={16} className="hidden sm:block" />
            Register as Doctor
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("pharmacy");
              setTxStatus(null);
              setTxMessage("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
              tab === "pharmacy"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 size={14} className="sm:hidden" />
            <Building2 size={16} className="hidden sm:block" />
            Register as Pharmacy
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <FormField label="Wallet Address">
            <input
              value={account || "Connect wallet to auto-fill address"}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </FormField>

          {tab === "doctor" ? (
            <>
              <FormField label="Full Name">
                <input
                  required
                  name="name"
                  value={doctorForm.name}
                  onChange={handleDoctorChange}
                  placeholder="Dr. Ahmad"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="MMC Registration Number">
                <input
                  required
                  name="licenseNumber"
                  value={doctorForm.licenseNumber}
                  onChange={handleDoctorChange}
                  placeholder="MMC-12345"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Specialization">
                <input
                  required
                  name="specialization"
                  value={doctorForm.specialization}
                  onChange={handleDoctorChange}
                  placeholder="General Practitioner"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Supporting Document">
                <input
                  required
                  name="supportingFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleDoctorChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Upload MMC certificate or supporting document. This will be stored on IPFS/Pinata.
                </p>
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Pharmacy Name">
                <input
                  required
                  name="name"
                  value={pharmacyForm.name}
                  onChange={handlePharmacyChange}
                  placeholder="RxCare Pharmacy"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Pharmacy Board Registration Number">
                <input
                  required
                  name="licenseNumber"
                  value={pharmacyForm.licenseNumber}
                  onChange={handlePharmacyChange}
                  placeholder="PBM-67890"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Pharmacy Address">
                <input
                  required
                  name="address"
                  value={pharmacyForm.address}
                  onChange={handlePharmacyChange}
                  placeholder="Kuala Lumpur, Malaysia"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Supporting Document">
                <input
                  required
                  name="supportingFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handlePharmacyChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Upload pharmacy licence or supporting document. This will be stored on IPFS/Pinata.
                </p>
              </FormField>
            </>
          )}

          <Button type="submit" disabled={!account || txStatus === "pending"}>
            {txStatus === "pending"
              ? "Submitting..."
              : "Submit Registration Request"}
          </Button>
        </form>

        <TxStatus status={txStatus} message={txMessage} />
      </Card>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}