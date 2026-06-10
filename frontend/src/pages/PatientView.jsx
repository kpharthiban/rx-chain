import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  ClipboardList,
  Copy,
  CheckCircle2,
  Wallet,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { CONTRACT_ADDRESS } from "../config/contract";

function formatDate(timestamp) {
  const seconds = Number(timestamp.toString ? timestamp.toString() : timestamp);
  if (!seconds) return "-";
  return new Date(seconds * 1000).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function deriveStatus(rx) {
  if (rx.revoked) return "revoked";
  if (rx.dispensed) return "dispensed";
  const expiry = Number(rx.expiryTimestamp.toString ? rx.expiryTimestamp.toString() : rx.expiryTimestamp);
  if (Date.now() / 1000 > expiry) return "expired";
  return "active";
}

export default function PatientView() {
  const { account, provider, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPrescriptions = async () => {
    if (!provider || !account) return;
    try {
      setLoading(true);
      setError("");
      const contract = getContract(provider);
      const ids = await contract.getMyPrescriptions();

      if (ids.length === 0) {
        setPrescriptions([]);
        return;
      }

      const results = await Promise.all(
        ids.map((id) => contract.getPrescription(id).then((data) => ({ id, data })))
      );

      const list = results.map(({ id, data }) => ({
        id: id.toString(),
        doctor: data.doctorName || data.doctor,
        drug: data.drugName || data.drug,
        dosage: data.dosage,
        issuedAt: formatDate(data.issuedTimestamp || data.issuedAt),
        expiry: formatDate(data.expiryTimestamp || data.expiry),
        status: deriveStatus(data),
      }));

      setPrescriptions(list);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setError(err.reason || err.message || "Failed to load prescriptions.");
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [provider, account]);

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
          <Card className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
            </div>
            <button
              onClick={loadPrescriptions}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </Card>

          {error && (
            <Card className="border-l-4 border-l-red-400 text-sm text-red-600">
              {error}
            </Card>
          )}

          {loading ? (
            <Card className="text-center">
              <div className="flex flex-col items-center py-8">
                <RefreshCw size={24} className="animate-spin text-slate-400" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading prescriptions from smart contract...
                </p>
              </div>
            </Card>
          ) : prescriptions.length > 0 ? (
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
        : rx.status === "expired"
          ? "border-l-amber-400"
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
            <QRCodeCanvas value={JSON.stringify({ prescriptionId: rx.id, contract: CONTRACT_ADDRESS })} size={110} level="M" />
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
