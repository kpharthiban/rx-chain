import { useState, useEffect, useRef } from "react";
import {
  Search,
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileQuestion,
  Wallet,
  ScanLine,
  Camera,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { fetchPrescriptionFromIPFS } from "../utils/ipfs";
import formatRxId from "../utils/formatRxId";

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
    border: "border-slate-200",
    bg: "bg-slate-50",
    icon: <FileQuestion size={20} className="text-slate-500" />,
    heading: "text-slate-900",
    text: "text-slate-600",
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
  const [historySearch, setHistorySearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);

  const loadHistory = async () => {
    if (!provider || !account) return;
    try {
      const contract = getContract(provider);
      const filter = contract.filters.PrescriptionDispensed(null, account, null);
      const events = await contract.queryFilter(filter);

      const items = [];
      for (const ev of events) {
        const id = ev.args.prescriptionId != null
          ? Number(ev.args.prescriptionId)
          : Number(ev.args[0]);
        const timestamp = ev.args.timestamp ?? ev.args[2];

        let patient = "-", drugName = "Unknown", dosage = "", doctorAddr = "-";
        try {
          const rx = await contract.getPrescription(id);
          patient = rx.patient;
          doctorAddr = rx.doctor;

          if (rx.ipfsCID && rx.ipfsCID !== "PENDING_IPFS") {
            try {
              const ipfsData = await fetchPrescriptionFromIPFS(rx.ipfsCID);
              drugName = ipfsData?.drugName || "Unknown";
              dosage = ipfsData?.dosage || "";
            } catch { /* ignore IPFS errors */ }
          }
        } catch { /* ignore if prescription fetch fails */ }

        items.push({
          id,
          timestamp: formatDate(timestamp),
          patient: shortenAddress(patient),
          patientFull: patient,
          doctor: shortenAddress(doctorAddr),
          drugName,
          dosage,
        });
      }

      setHistory(items);
    } catch (err) {
      console.error("Failed to load dispensing history:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [provider, account]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch { /* already stopped */ }
      try {
        scannerRef.current.clear();
      } catch { /* already cleared */ }
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    let scannedId = null;

    try {
      const data = JSON.parse(decodedText);
      if (data.prescriptionId !== undefined && data.prescriptionId !== null) {
        scannedId = String(data.prescriptionId);
      }
    } catch {
      const plainId = decodedText.trim();
      if (/^\d+$/.test(plainId)) {
        scannedId = plainId;
      }
    }

    if (scannedId === null) {
      setScannerError("Invalid QR code format. Expected a prescription QR from RxChain.");
      return;
    }

    await stopScanner();
    setRxId(scannedId);
    setScannerOpen(false);
    setTimeout(() => verifyPrescription(scannedId), 200);
  };

  useEffect(() => {
    if (!scannerOpen) return;

    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;

      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;

      html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      ).catch((err) => {
        console.error("Failed to start QR scanner:", err);
        if (mounted) {
          setScannerError("Could not access camera. Please allow camera permissions and try again.");
        }
      });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [scannerOpen]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const verifyPrescription = async (overrideId) => {
    const idToVerify = overrideId || rxId.trim();
    if (!idToVerify) return;

    const stripped = idToVerify.replace(/^RX-/i, "");
    const parsedId = parseInt(stripped, 10);
    if (isNaN(parsedId) || parsedId < 0 || String(parsedId) !== stripped) {
      setResult({ status: "notfound" });
      setTxStatus(null);
      return;
    }

    try {
      setTxStatus("pending");
      setTxMessage("Fetching prescription from the blockchain...");
      setResult(null);

      const contract = getContract(provider);

      let rx;
      try {
        rx = await contract.getPrescription(parsedId);
      } catch (fetchErr) {
        console.warn("getPrescription failed:", fetchErr);
        setTxStatus(null);
        setTxMessage("");
        setResult({ status: "notfound" });
        return;
      }

      setTxStatus(null);
      setTxMessage("");

      if (!rx.issuedAt || Number(rx.issuedAt) === 0) {
        setResult({ status: "notfound" });
        return;
      }

      let ipfsData = null;
      if (rx.ipfsCID && rx.ipfsCID !== "PENDING_IPFS") {
        try {
          ipfsData = await fetchPrescriptionFromIPFS(rx.ipfsCID);
        } catch {
          // ignore IPFS fetch failures
        }
      }

      const base = {
        doctor: shortenAddress(rx.doctor),
        patient: shortenAddress(rx.patient),
        dataHash: rx.dataHash,
        issued: formatDate(rx.issuedAt),
        expiry: formatDate(rx.expiryTimestamp),
        ipfsCID: rx.ipfsCID,
        drugName: ipfsData?.drugName || null,
        dosage: ipfsData?.dosage || null,
        frequency: ipfsData?.frequency || null,
        duration: ipfsData?.duration || null,
      };

      if (rx.revoked) {
        setResult({ ...base, status: "revoked" });
        return;
      }

      if (rx.dispensed) {
        setResult({ ...base, status: "dispensed" });
        return;
      }

      if (Date.now() / 1000 > rx.expiryTimestamp.toNumber()) {
        setResult({ ...base, status: "expired" });
        return;
      }

      setResult({ ...base, status: "valid" });
    } catch (err) {
      console.error("Verification failed:", err);

      const reason =
        err.data?.message?.replace("VM Exception while processing transaction: revert ", "") ||
        err.error?.data?.message?.replace("VM Exception while processing transaction: revert ", "") ||
        err.error?.message ||
        err.reason ||
        err.message ||
        "Failed to verify prescription.";

      if (reason.includes("missing revert data") || reason.includes("does not exist")) {
        setTxStatus(null);
        setResult({ status: "notfound" });
        return;
      }

      setTxStatus("failed");
      setTxMessage(reason);
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
      setResult((prev) => ({
        ...prev,
        status: "dispensed",
        doctor: shortenAddress(rx.doctor),
        patient: shortenAddress(rx.patient),
        issued: formatDate(rx.issuedAt),
        expiry: formatDate(rx.expiryTimestamp),
      }));

      await loadHistory();
    } catch (err) {
      console.error("Dispense failed:", err);

      const reason =
        err.data?.message?.replace("VM Exception while processing transaction: revert ", "") ||
        err.error?.data?.message?.replace("VM Exception while processing transaction: revert ", "") ||
        err.error?.message ||
        err.reason ||
        err.message ||
        "Failed to dispense prescription.";

      setTxStatus("failed");
      setTxMessage(reason);
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
              placeholder="Enter Prescription ID e.g. RX-001"
              onKeyDown={(e) => e.key === "Enter" && verifyPrescription()}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Button onClick={() => verifyPrescription()}>Verify</Button>
            <button
              type="button"
              onClick={() => { setScannerOpen(true); setScannerError(""); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ScanLine size={16} />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
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
                      ? "Prescription Not Found"
                      : "Prescription Found"}
                  </h3>
                </div>
                <Badge type={result.status}>{cfg.label}</Badge>
              </div>

              {result.status === "notfound" && (
                <p className="mt-1 text-sm text-slate-500">
                  No prescription exists with ID {formatRxId(rxId)}. Please check the ID and try again.
                </p>
              )}

              {result.status !== "notfound" && (
                <div className="grid gap-2">
                  {result.drugName && (
                    <InfoRow label="Drug" value={result.drugName} className={cfg.text} />
                  )}
                  {result.dosage && (
                    <InfoRow label="Dosage" value={result.dosage} className={cfg.text} />
                  )}
                  {result.frequency && (
                    <InfoRow label="Frequency" value={result.frequency} className={cfg.text} />
                  )}
                  {result.duration && (
                    <InfoRow label="Duration" value={result.duration} className={cfg.text} />
                  )}
                  <InfoRow label="Doctor" value={result.doctor} className={cfg.text} />
                  <InfoRow label="Patient" value={result.patient} className={cfg.text} />
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

        {scannerOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Camera size={20} className="text-brand-600" />
                  Scan Prescription QR
                </h3>
                <button
                  onClick={() => setScannerOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-4 text-sm text-slate-500">
                Point your camera at the patient's prescription QR code.
              </p>

              <div id="qr-reader" className="overflow-hidden rounded-xl" style={{ minHeight: "300px" }} />

              {scannerError && (
                <p className="mt-3 text-sm text-red-600">{scannerError}</p>
              )}

              <button
                onClick={() => setScannerOpen(false)}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <Card>
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Dispensing History
          </h2>

          {history.length > 0 ? (
            <>
              <div className="mb-4 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID, drug name, patient, or doctor..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {(() => {
                const q = historySearch.toLowerCase();
                const filtered = history.filter(
                  (h) =>
                    !historySearch ||
                    String(h.id).includes(q) ||
                    formatRxId(h.id).toLowerCase().includes(q) ||
                    h.drugName.toLowerCase().includes(q) ||
                    h.patient.toLowerCase().includes(q) ||
                    (h.patientFull && h.patientFull.toLowerCase().includes(q)) ||
                    h.doctor.toLowerCase().includes(q)
                );
                return filtered.length > 0 ? (
                  <>
                    <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/80">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-600">Rx ID</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Drug Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Dosage</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Patient</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Doctor</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Dispensed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((item) => (
                            <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                              <td className="px-4 py-3.5">
                                <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                  {formatRxId(item.id)}
                                </code>
                              </td>
                              <td className="px-4 py-3.5 font-medium text-slate-900">{item.drugName}</td>
                              <td className="px-4 py-3.5 text-slate-600">{item.dosage || "-"}</td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-500" title={item.patientFull}>
                                {item.patient}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{item.doctor}</td>
                              <td className="px-4 py-3.5 text-slate-500">{item.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {filtered.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-semibold text-slate-900">
                              {formatRxId(item.id)} — {item.drugName}
                            </p>
                            <Badge type="dispensed">Dispensed</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            {item.dosage && (
                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Dosage</span>
                                <span className="text-slate-700">{item.dosage}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Patient</span>
                              <span className="font-mono text-xs text-slate-600">{item.patient}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Doctor</span>
                              <span className="font-mono text-xs text-slate-600">{item.doctor}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Date</span>
                              <span className="text-slate-600">{item.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Pill size={24} />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      No dispensing records match your search.
                    </p>
                  </div>
                );
              })()}
            </>
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
