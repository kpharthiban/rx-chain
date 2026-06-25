import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  ClipboardList,
  Copy,
  CheckCircle2,
  Wallet,
  QrCode,
  RefreshCw,
  Search,
  X,
  Maximize2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { fetchPrescriptionFromIPFS } from "../utils/ipfs";
import { CONTRACT_ADDRESS } from "../config/contract";
import formatRxId from "../utils/formatRxId";

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
  const [searchQuery, setSearchQuery] = useState("");

  const loadPrescriptions = async () => {
    if (!provider || !account) return;
    try {
      setLoading(true);
      setError("");
      const contract = getContract(provider);

      const events = await contract.queryFilter(
        contract.filters.PrescriptionIssued(null, null, account)
      );

      if (events.length === 0) {
        setPrescriptions([]);
        return;
      }

      const list = [];
      for (const ev of events) {
        const id = ev.args.prescriptionId ?? ev.args[0];
        try {
          const rx = await contract.getPrescription(id);

          let ipfsData = null;
          if (rx.ipfsCID && rx.ipfsCID !== "PENDING_IPFS") {
            try {
              ipfsData = await fetchPrescriptionFromIPFS(rx.ipfsCID);
            } catch {
              // ignore IPFS fetch failures
            }
          }

          list.push({
            id: Number(id),
            doctor: rx.doctor,
            drugName: ipfsData?.drugName || "Prescription",
            dosage: ipfsData?.dosage || "",
            frequency: ipfsData?.frequency || "",
            issuedAt: formatDate(rx.issuedAt),
            expiry: formatDate(rx.expiryTimestamp),
            status: deriveStatus(rx),
            ipfsCID: rx.ipfsCID,
          });
        } catch {
          // skip prescriptions that fail to load
        }
      }

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
                <p className="text-sm font-semibold text-slate-900">
                  {account.slice(0, 6)}...{account.slice(-4)}
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
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID, drug name, doctor address, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              {(() => {
                const statusOrder = { active: 0, dispensed: 1, expired: 2, revoked: 3 };
                const q = searchQuery.toLowerCase();
                const filtered = prescriptions
                  .filter(
                    (rx) =>
                      !searchQuery ||
                      String(rx.id).includes(q) ||
                      formatRxId(rx.id).toLowerCase().includes(q) ||
                      (rx.drugName && rx.drugName.toLowerCase().includes(q)) ||
                      (rx.doctor && rx.doctor.toLowerCase().includes(q)) ||
                      (rx.status && rx.status.toLowerCase().includes(q))
                  )
                  .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
                return filtered.length > 0 ? (
                  filtered.map((rx) => (
                    <PrescriptionCard key={rx.id} rx={rx} />
                  ))
                ) : (
                  <Card className="text-center">
                    <div className="flex flex-col items-center py-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <ClipboardList size={24} />
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        No prescriptions match your search.
                      </p>
                    </div>
                  </Card>
                );
              })()}
            </>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">
              Are you a doctor or pharmacy representative?{" "}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2">
                Register here
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ rx }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatRxId(rx.id));
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

  const qrValue = JSON.stringify({ prescriptionId: rx.id, contract: CONTRACT_ADDRESS });

  return (
    <>
      <Card className={`border-l-4 p-4 sm:p-6 ${borderAccent}`}>
        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                Prescription {formatRxId(rx.id)} — {rx.drugName}
              </h3>
              <Badge type={rx.status}>{rx.status}</Badge>
            </div>

            <div className="grid gap-1.5 text-sm">
              <InfoRow label="Doctor" value={rx.doctor} truncate />
              {rx.dosage && <InfoRow label="Dosage" value={rx.dosage} />}
              {rx.frequency && <InfoRow label="Frequency" value={rx.frequency} />}
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
            <button
              onClick={() => setQrOpen(true)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md"
            >
              <QRCodeCanvas value={qrValue} size={110} level="M" />
              <span className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-brand-600">
                <Maximize2 size={11} />
                Tap to enlarge
              </span>
            </button>
          )}
        </div>
      </Card>

      {qrOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQrOpen(false)}
          />
          <div className="relative flex flex-col items-center gap-5 rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{formatRxId(rx.id)} — {rx.drugName}</p>
                <p className="mt-0.5 text-xs text-slate-500">Show this QR to the pharmacist</p>
              </div>
              <button
                onClick={() => setQrOpen(false)}
                className="ml-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <QRCodeCanvas value={qrValue} size={240} level="M" />

            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <QrCode size={13} />
              Scan to verify on RxChain
            </span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function InfoRow({ label, value, truncate = false }) {
  return (
    <div className="flex items-baseline gap-2 overflow-hidden">
      <span className="w-20 shrink-0 text-slate-400">{label}</span>
      <span className={`font-medium text-slate-700 ${truncate ? "truncate" : ""}`}>{value}</span>
    </div>
  );
}
