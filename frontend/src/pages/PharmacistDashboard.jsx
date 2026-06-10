import { useState, useEffect } from "react";
import {
  Search,
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";

const statusConfig = {
  valid: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    icon: <CheckCircle2 size={20} className="text-emerald-600" />,
    heading: "text-emerald-900",
    text: "text-emerald-800",
    label: "Valid — Ready to Dispense",
  },
  expired: {
    border: "border-orange-200",
    bg: "bg-orange-50",
    icon: <Clock size={20} className="text-orange-600" />,
    heading: "text-orange-900",
    text: "text-orange-800",
    label: "Expired",
  },
  dispensed: {
    border: "border-sky-200",
    bg: "bg-sky-50",
    icon: <AlertTriangle size={20} className="text-sky-600" />,
    heading: "text-sky-900",
    text: "text-sky-800",
    label: "Already Dispensed",
  },
  revoked: {
    border: "border-red-200",
    bg: "bg-red-50",
    icon: <XCircle size={20} className="text-red-600" />,
    heading: "text-red-900",
    text: "text-red-800",
    label: "Revoked",
  },
  notfound: {
    border: "border-red-200",
    bg: "bg-red-50",
    icon: <XCircle size={20} className="text-red-600" />,
    heading: "text-red-900",
    text: "text-red-800",
    label: "Not Found",
  },
};

function shortenAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

export default function PharmacistDashboard() {
  const { account, provider, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();
  const [rxId, setRxId] = useState("");
  const [result, setResult] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!provider || !account) return;

    const loadHistory = async () => {
      try {
        const contract = getContract(provider);
        const filter = contract.filters.PrescriptionDispensed(null, account, null);
        const events = await contract.queryFilter(filter);
        setHistory(
          events.map((ev) => ({
            id: ev.args.prescriptionId != null
              ? ev.args.prescriptionId.toString()
              : ev.args[0].toString(),
            timestamp: ev.args.timestamp
              ? formatDate(ev.args.timestamp)
              : ev.args[2]
                ? formatDate(ev.args[2])
                : "-",
          }))
        );
      } catch (err) {
        console.error("Failed to load dispensing history:", err);
      }
    };

    loadHistory();
  }, [provider, account]);

  const verifyPrescription = async () => {
    if (!rxId.trim()) return;

    try {
      setTxStatus("pending");
      setTxMessage("Fetching prescription from the blockchain...");
      setResult(null);

      const contract = getContract(provider);
      const rx = await contract.getPrescription(rxId.trim());

      setTxStatus(null);
      setTxMessage("");

      if (!rx.issuedAt || rx.issuedAt.toNumber() === 0) {
        setResult({ status: "notfound" });
        return;
      }

      if (rx.revoked) {
        setResult({
          status: "revoked",
          doctor: shortenAddress(rx.doctor),
          patient: shortenAddress(rx.patient),
          dataHash: rx.dataHash,
          issued: formatDate(rx.issuedAt),
          expiry: formatDate(rx.expiryTimestamp),
        });
        return;
      }

      if (rx.dispensed) {
        setResult({
          status: "dispensed",
          doctor: shortenAddress(rx.doctor),
          patient: shortenAddress(rx.patient),
          dataHash: rx.dataHash,
          issued: formatDate(rx.issuedAt),
          expiry: formatDate(rx.expiryTimestamp),
        });
        return;
      }

      if (Date.now() / 1000 > rx.expiryTimestamp.toNumber()) {
        setResult({
          status: "expired",
          doctor: shortenAddress(rx.doctor),
          patient: shortenAddress(rx.patient),
          dataHash: rx.dataHash,
          issued: formatDate(rx.issuedAt),
          expiry: formatDate(rx.expiryTimestamp),
        });
        return;
      }

      setResult({
        status: "valid",
        doctor: shortenAddress(rx.doctor),
        patient: shortenAddress(rx.patient),
        dataHash: rx.dataHash,
        issued: formatDate(rx.issuedAt),
        expiry: formatDate(rx.expiryTimestamp),
      });
    } catch (err) {
      console.error("Verification failed:", err);
      setTxStatus("failed");
      setTxMessage(err.reason || err.message || "Failed to verify prescription.");
      setResult(null);
    }
  };

  const dispensePrescription = async () => {
    try {
      const contract = getContract(provider);

      setTxStatus("pending");
      setTxMessage("Waiting for MetaMask confirmation...");

      const tx = await contract.dispensePrescription(rxId.trim());

      setTxMessage("Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage("Prescription has been marked as dispensed on-chain.");

      const rx = await contract.getPrescription(rxId.trim());
      setResult({
        status: "dispensed",
        doctor: shortenAddress(rx.doctor),
        patient: shortenAddress(rx.patient),
        dataHash: rx.dataHash,
        issued: formatDate(rx.issuedAt),
        expiry: formatDate(rx.expiryTimestamp),
      });

      const filter = contract.filters.PrescriptionDispensed(null, account, null);
      const events = await contract.queryFilter(filter);
      setHistory(
        events.map((ev) => ({
          id: ev.args.prescriptionId != null
            ? ev.args.prescriptionId.toString()
            : ev.args[0].toString(),
          timestamp: ev.args.timestamp
            ? formatDate(ev.args.timestamp)
            : ev.args[2]
              ? formatDate(ev.args[2])
              : "-",
        }))
      );
    } catch (err) {
      console.error("Dispense failed:", err);
      setTxStatus("failed");
      setTxMessage(err.reason || err.message || "Failed to dispense prescription.");
    }
  };

  const cfg = result ? statusConfig[result.status] : null;

  if (!account) {
    return (
      <div className="animate-fade-in-up">
        <PageHeader
          title="Pharmacist Dashboard"
          subtitle="Verify prescription validity and mark medication as dispensed."
          icon={<Pill size={22} />}
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
              Connect your MetaMask wallet to access the pharmacist dashboard.
            </p>
            <Button className="mt-5" onClick={async () => {
              const addr = await connectWallet();
              if (addr) navigate(getRoleRedirectPath());
            }}>
              Connect Wallet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Pharmacist Dashboard"
        subtitle="Verify prescription validity and mark medication as dispensed."
        icon={<Pill size={22} />}
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Search size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Verify Prescription
            </h2>
          </div>

          <div className="flex gap-3">
            <input
              value={rxId}
              onChange={(e) => setRxId(e.target.value)}
              placeholder="Enter Prescription ID e.g. 001"
              onKeyDown={(e) => e.key === "Enter" && verifyPrescription()}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Button onClick={verifyPrescription}>Verify</Button>
          </div>

          {result && cfg && (
            <div
              className={`mt-6 animate-slide-up rounded-2xl border p-5 ${cfg.border} ${cfg.bg}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <h3 className={`font-bold ${cfg.heading}`}>
                    {result.status === "notfound"
                      ? "No prescription found with this ID."
                      : "Prescription Found"}
                  </h3>
                </div>
                <Badge type={result.status}>{cfg.label}</Badge>
              </div>

              {result.status !== "notfound" && (
                <div className="grid gap-2">
                  <InfoRow label="Doctor" value={result.doctor} className={cfg.text} />
                  <InfoRow label="Patient" value={result.patient} className={cfg.text} />
                  <InfoRow label="Drug Hash" value={result.dataHash} className={cfg.text} />
                  <InfoRow label="Issued" value={result.issued} className={cfg.text} />
                  <InfoRow label="Expiry" value={result.expiry} className={cfg.text} />
                </div>
              )}

              {result.status === "valid" && (
                <Button
                  className="mt-5 w-full"
                  variant="success"
                  onClick={dispensePrescription}
                >
                  <CheckCircle2 size={16} />
                  Dispense Medication
                </Button>
              )}

              {result.status === "dispensed" && (
                <p className="mt-4 text-sm font-medium text-sky-700">
                  This prescription has already been dispensed.
                </p>
              )}

              {result.status === "revoked" && (
                <p className="mt-4 text-sm font-medium text-red-700">
                  This prescription was revoked by the issuing doctor.
                </p>
              )}

              {result.status === "expired" && (
                <p className="mt-4 text-sm font-medium text-orange-700">
                  This prescription has expired.
                </p>
              )}
            </div>
          )}

          <TxStatus status={txStatus} message={txMessage} />
        </Card>

        <Card>
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Dispensing History
          </h2>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">#{item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge type="dispensed">Dispensed</Badge>
                    <p className="mt-1 text-xs text-slate-400">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Pill size={24} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                No medications dispensed yet.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = "" }) {
  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <span className="font-medium opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
