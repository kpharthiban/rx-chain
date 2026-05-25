import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  ClipboardList,
  Copy,
  CheckCircle2,
  Wallet,
  QrCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import useWallet from "../hooks/useWallet";

const prescriptions = [
  {
    id: "001",
    doctor: "Dr. Ahmad",
    drug: "Ritalin 10mg",
    dosage: "1 tablet, once daily",
    expiry: "5 Jun 2026",
    issuedAt: "22 May 2026",
    status: "active",
  },
  {
    id: "002",
    doctor: "Dr. Siti",
    drug: "Amoxicillin 500mg",
    dosage: "1 capsule, 3x daily",
    expiry: "3 Jun 2026",
    issuedAt: "20 May 2026",
    status: "dispensed",
  },
  {
    id: "003",
    doctor: "Dr. Ahmad",
    drug: "Ritalin 10mg",
    dosage: "1 tablet, once daily",
    expiry: "30 May 2026",
    issuedAt: "15 May 2026",
    status: "revoked",
  },
];

export default function PatientView() {
  const { account, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="My Prescriptions"
        subtitle="View prescriptions issued to your connected wallet."
        icon={<ClipboardList size={22} />}
      />

      {!account ? (
        <Card className="text-center">
          <div className="flex flex-col items-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Wallet size={28} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Connect Your Wallet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Connect your MetaMask wallet to view prescriptions issued to your
              address.
            </p>
            <Button className="mt-5" onClick={async () => {
              const addr = await connectWallet();
              if (addr) navigate(getRoleRedirectPath());
            }}>
              Connect Wallet
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Connected Patient Wallet
              </p>
              <p className="font-mono text-sm font-semibold text-slate-900">
                {account}
              </p>
            </div>
          </Card>

          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} rx={rx} />
            ))
          ) : (
            <Card className="text-center">
              <div className="flex flex-col items-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ClipboardList size={24} />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  No prescriptions found for this wallet.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ rx }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rx.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const borderAccent =
    rx.status === "active"
      ? "border-l-emerald-400"
      : rx.status === "dispensed"
        ? "border-l-sky-400"
        : "border-l-red-400";

  return (
    <Card className={`border-l-4 p-4 sm:p-6 ${borderAccent}`}>
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">Rx #{rx.id}</h3>
            <Badge type={rx.status}>{rx.status}</Badge>
          </div>

          <div className="grid gap-1.5 text-sm">
            <InfoRow label="Doctor" value={rx.doctor} />
            <InfoRow label="Drug" value={rx.drug} />
            <InfoRow label="Dosage" value={rx.dosage} />
            <InfoRow label="Issued" value={rx.issuedAt} />
            <InfoRow label="Expiry" value={rx.expiry} />
          </div>

          <button
            onClick={handleCopy}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            {copied ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Prescription ID
              </>
            )}
          </button>
        </div>

        {rx.status === "active" && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <QRCodeCanvas value={rx.id} size={110} level="M" />
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <QrCode size={12} />
              Scan to verify
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-16 shrink-0 text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
