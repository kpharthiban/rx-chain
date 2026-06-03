import { useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { uploadPrescriptionToIPFS } from "../utils/ipfs";

const mockPrescriptions = [
  { id: "#001", patient: "0xAB...123", expiry: "5 Jun 2026", status: "active" },
  { id: "#002", patient: "0xCD...456", expiry: "3 Jun 2026", status: "dispensed" },
  { id: "#003", patient: "0xEF...789", expiry: "1 Jun 2026", status: "revoked" },
];

export default function DoctorDashboard() {
  const { account, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();

  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");
  const [confirmingRevoke, setConfirmingRevoke] = useState(null);
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);

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

  const handleIssue = (e) => {
    e.preventDefault();

    setTxStatus("pending");
    setTxMessage("Issuing prescription — waiting for MetaMask confirmation...");

    setTimeout(() => {
      setTxStatus("confirmed");
      setTxMessage("Prescription issued successfully. ID: #004");
    }, 1000);
  };

  const handleRevoke = (id) => {
    setConfirmingRevoke(null);

    setTxStatus("pending");
    setTxMessage(`Revoking prescription ${id} — waiting for MetaMask confirmation...`);

    setTimeout(() => {
      setPrescriptions((prev) =>
        prev.map((rx) => (rx.id === id ? { ...rx, status: "revoked" } : rx))
      );

      setTxStatus("confirmed");
      setTxMessage(`Prescription ${id} revoked successfully.`);
    }, 1000);
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
          value="12"
          icon={<FileText size={18} />}
          color="brand"
        />

        <StatCard
          label="Active"
          value="7"
          icon={<Activity size={18} />}
          color="emerald"
        />

        <StatCard
          label="Dispensed"
          value="4"
          icon={<CheckCircle size={18} />}
          color="sky"
        />

        <StatCard
          label="Revoked"
          value="1"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Drug Name">
              <input
                placeholder="e.g. Ritalin 10mg"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Dosage / Frequency">
              <input
                placeholder="e.g. 1 tablet, once daily"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Expiry Date">
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Additional Notes">
              <textarea
                rows={3}
                placeholder="Extra notes stored off-chain (IPFS)"
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
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Prescriptions Issued
          </h2>

          {prescriptions.length > 0 ? (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{rx.id}</p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Patient: {rx.patient}
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