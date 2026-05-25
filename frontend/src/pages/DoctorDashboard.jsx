import { useState } from "react";
import {
  FileText,
  Activity,
  CheckCircle,
  Ban,
  Stethoscope,
  Send,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import TxStatus from "../components/TxStatus";

const mockPrescriptions = [
  { id: "#001", patient: "0xAB...123", expiry: "5 Jun 2026", status: "active" },
  { id: "#002", patient: "0xCD...456", expiry: "3 Jun 2026", status: "dispensed" },
  { id: "#003", patient: "0xEF...789", expiry: "1 Jun 2026", status: "revoked" },
];

export default function DoctorDashboard() {
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const handleIssue = (e) => {
    e.preventDefault();
    setTxStatus("pending");
    setTxMessage("Issuing prescription — waiting for MetaMask confirmation...");
    setTimeout(() => {
      setTxStatus("confirmed");
      setTxMessage("Prescription issued successfully. ID: #004");
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
            My Prescriptions
          </h2>

          {mockPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {mockPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{rx.id}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Patient: {rx.patient}
                    </p>
                    <p className="text-sm text-slate-500">Expiry: {rx.expiry}</p>
                  </div>
                  <Badge type={rx.status}>{rx.status}</Badge>
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
      <p className="mt-3 text-sm text-slate-500">No prescriptions issued yet.</p>
    </div>
  );
}
