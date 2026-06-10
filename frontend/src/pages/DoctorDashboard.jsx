import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  FileText,
  Activity,
  CheckCircle,
  Ban,
  Stethoscope,
  Send,
  XCircle,
  Wallet,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { uploadPrescriptionToIPFS } from "../utils/ipfs";

const REVERT_MESSAGES = {
  "Invalid patient address": "Please enter a valid patient wallet address.",
  "Patient address is zero": "Please enter a valid patient wallet address.",
  "Prescription does not exist": "Prescription not found.",
  "Not the issuing doctor": "You did not issue this prescription.",
  "Only the issuing doctor or admin can revoke": "You did not issue this prescription.",
  "Already revoked": "This prescription is already revoked.",
  "Prescription is already revoked": "This prescription is already revoked.",
  "Expiry too far": "Expiry date cannot be more than 30 days from today.",
  "Expiry exceeds maximum validity of 30 days": "Expiry date cannot be more than 30 days from today.",
};

function translateRevert(err) {
  if (err.reason && REVERT_MESSAGES[err.reason]) {
    return REVERT_MESSAGES[err.reason];
  }
  if (err.reason) return err.reason;
  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return "Transaction rejected. You cancelled the MetaMask request.";
  }
  if (err.message && err.message.includes("insufficient funds")) {
    return "Insufficient funds to cover gas. Top up your Sepolia ETH.";
  }
  return err.message || "An unknown error occurred.";
}

function shortenAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function deriveStatus(rx) {
  if (rx.revoked) return "revoked";
  if (rx.dispensed) return "dispensed";
  if (Math.floor(Date.now() / 1000) > Number(rx.expiryTimestamp)) return "expired";
  return "active";
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const seconds = Number(timestamp.toString ? timestamp.toString() : timestamp);
  if (!seconds) return "-";
  return new Date(seconds * 1000).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DoctorDashboard() {
  const { account, provider, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();

  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");
  const [confirmingRevoke, setConfirmingRevoke] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [patientAddress, setPatientAddress] = useState("");
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const loadPrescriptions = useCallback(async () => {
    if (!provider || !account) return;

    try {
      setLoadingList(true);
      const contract = getContract(provider);

      const events = await contract.queryFilter(
        contract.filters.PrescriptionIssued(null, account, null, null)
      );

      const items = [];
      for (const ev of events) {
        const id = ev.args.prescriptionId ?? ev.args[0];
        try {
          const rx = await contract.getPrescription(id);
          items.push({
            id: Number(id),
            patient: rx.patient,
            expiryTimestamp: rx.expiryTimestamp,
            expiry: formatDate(rx.expiryTimestamp),
            dispensed: rx.dispensed,
            revoked: rx.revoked,
            status: deriveStatus(rx),
          });
        } catch {
          // skip prescriptions that fail to load
        }
      }

      setPrescriptions(items);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
    } finally {
      setLoadingList(false);
    }
  }, [provider, account]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const totalIssued = prescriptions.length;
  const activeCount = prescriptions.filter((rx) => rx.status === "active").length;
  const dispensedCount = prescriptions.filter((rx) => rx.status === "dispensed").length;
  const revokedCount = prescriptions.filter((rx) => rx.status === "revoked").length;

  const testIPFSUpload = async () => {
    try {
      setTxStatus("pending");
      setTxMessage("Uploading temporary prescription data to IPFS via Pinata...");

      const testData = {
        patientName: "Test Patient",
        patientWallet: "0x0000000000000000000000000000000000000001",
        drugName: "Ritalin 10mg",
        dosage: "1 tablet daily",
        frequency: "Once per day",
        notes: "Temporary IPFS upload test from RxChain frontend",
        createdAt: new Date().toISOString(),
      };

      const result = await uploadPrescriptionToIPFS(testData);

      setTxStatus("confirmed");
      setTxMessage(`IPFS upload successful. CID: ${result.cid}`);

      alert(`IPFS upload successful!\nCID: ${result.cid}`);
      console.log("IPFS upload result:", result);
    } catch (error) {
      setTxStatus("failed");
      setTxMessage(error.message || "IPFS upload failed.");

      alert(`IPFS upload failed: ${error.message}`);
      console.error(error);
    }
  };

  if (!account) {
    return (
      <div className="animate-fade-in-up">
        <PageHeader
          title="Doctor Dashboard"
          subtitle="Issue blockchain-verified prescriptions and manage prescription records."
          icon={<Stethoscope size={22} />}
        />

        <Card className="text-center">
          <div className="flex flex-col items-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Wallet size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Connect Your Wallet
            </h2>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Connect your MetaMask wallet to access the doctor dashboard.
            </p>

            <Button
              className="mt-5"
              onClick={async () => {
                const addr = await connectWallet();
                if (addr) navigate(getRoleRedirectPath());
              }}
            >
              Connect Wallet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleIssue = async (e) => {
    e.preventDefault();

    if (!ethers.utils.isAddress(patientAddress)) {
      setTxStatus("failed");
      setTxMessage("Please enter a valid patient wallet address.");
      return;
    }

    if (!drugName.trim() || !dosage.trim() || !frequency.trim() || !duration.trim() || !expiryDate) {
      setTxStatus("failed");
      setTxMessage("All fields are required.");
      return;
    }

    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (expiryTimestamp <= now) {
      setTxStatus("failed");
      setTxMessage("Expiry date must be in the future.");
      return;
    }
    if (expiryTimestamp > now + 30 * 24 * 60 * 60) {
      setTxStatus("failed");
      setTxMessage("Expiry date cannot be more than 30 days from today.");
      return;
    }

    const combinedString = `${drugName}|${dosage}|${frequency}|${duration}`;
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(combinedString));

    try {
      setTxStatus("pending");
      setTxMessage("Issuing prescription — waiting for MetaMask confirmation...");

      const contract = getContract(provider);
      const tx = await contract.issuePrescription(
        patientAddress,
        dataHash,
        "PENDING_IPFS",
        expiryTimestamp
      );

      setTxMessage("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();

      const event = receipt.events?.find((ev) => ev.event === "PrescriptionIssued");
      const newId = event ? Number(event.args.prescriptionId ?? event.args[0]) : null;

      setTxStatus("confirmed");
      setTxMessage(
        newId != null
          ? `Prescription issued successfully. ID: #${newId}`
          : "Prescription issued successfully."
      );

      setPatientAddress("");
      setDrugName("");
      setDosage("");
      setFrequency("");
      setDuration("");
      setExpiryDate("");

      await loadPrescriptions();
    } catch (err) {
      console.error("Issue prescription failed:", err);
      setTxStatus("failed");
      setTxMessage(translateRevert(err));
    }
  };

  const handleRevoke = async (id) => {
    setConfirmingRevoke(null);

    try {
      setTxStatus("pending");
      setTxMessage(`Revoking prescription #${id} — waiting for MetaMask confirmation...`);

      const contract = getContract(provider);
      const tx = await contract.revokePrescription(id);

      setTxMessage("Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage(`Prescription #${id} revoked successfully.`);

      await loadPrescriptions();
    } catch (err) {
      console.error("Revoke failed:", err);
      setTxStatus("failed");
      setTxMessage(translateRevert(err));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Issue blockchain-verified prescriptions and manage prescription records."
        icon={<Stethoscope size={22} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Issued"
          value={String(totalIssued)}
          icon={<FileText size={18} />}
          color="brand"
        />

        <StatCard
          label="Active"
          value={String(activeCount)}
          icon={<Activity size={18} />}
          color="emerald"
        />

        <StatCard
          label="Dispensed"
          value={String(dispensedCount)}
          icon={<CheckCircle size={18} />}
          color="sky"
        />

        <StatCard
          label="Revoked"
          value={String(revokedCount)}
          icon={<Ban size={18} />}
          color="red"
        />
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={testIPFSUpload}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
        >
          <UploadCloud size={16} />
          Test IPFS Upload
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Send size={18} className="text-brand-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Issue New Prescription
            </h2>
          </div>

          <form onSubmit={handleIssue} className="grid gap-4">
            <FormField label="Patient Wallet Address">
              <input
                placeholder="0x..."
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Drug Name">
              <input
                placeholder="e.g. Ritalin 10mg"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Dosage">
              <input
                placeholder="e.g. 1 tablet"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Frequency">
              <input
                placeholder="e.g. once daily"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Duration">
              <input
                placeholder="e.g. 7 days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Expiry Date">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <Button type="submit">
              <Send size={16} />
              Issue Prescription
            </Button>
          </form>

          <TxStatus status={txStatus} message={txMessage} />
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Prescriptions Issued
            </h2>

            <button
              onClick={loadPrescriptions}
              disabled={loadingList}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={loadingList ? "animate-spin" : ""} />
              {loadingList ? "Loading..." : "Refresh"}
            </button>
          </div>

          {prescriptions.length > 0 ? (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">#{rx.id}</p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Patient: {shortenAddress(rx.patient)}
                      </p>

                      <p className="text-sm text-slate-500">
                        Expiry: {rx.expiry}
                      </p>
                    </div>

                    <Badge type={rx.status}>{rx.status}</Badge>
                  </div>

                  {rx.status === "active" && confirmingRevoke !== rx.id && (
                    <div className="mt-3">
                      <button
                        onClick={() => setConfirmingRevoke(rx.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all duration-200 hover:border-red-400 hover:bg-red-100 active:scale-[0.97]"
                      >
                        <XCircle size={14} />
                        Revoke Prescription
                      </button>
                    </div>
                  )}

                  {confirmingRevoke === rx.id && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3">
                      <p className="flex-1 text-xs font-medium text-red-700">
                        Revoke this prescription? This cannot be undone.
                      </p>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRevoke(rx.id)}
                      >
                        Confirm
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmingRevoke(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </Card>
      </div>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileText size={24} />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        No prescriptions issued yet.
      </p>
    </div>
  );
}
