import { useEffect, useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Ban,
  Users,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

import Card from "../components/Card";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";

const tabs = [
  { key: "doctors", label: "Doctors", icon: <UserCheck size={16} /> },
  { key: "pharmacies", label: "Pharmacies", icon: <Building2 size={16} /> },
  { key: "revocations", label: "Verified", icon: <Users size={16} /> },
];

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

function normalizeRequest(item, index) {
  return {
    id: index,
    requester: item.requester,
    name: item.name,
    license: item.licenseNumber,
    ipfsCID: item.ipfsCID,
    status: Number(item.status),
    rejectionReason: item.rejectionReason,
    submittedAt: item.submittedAt,
    date: formatDate(item.submittedAt),
    wallet: shortenAddress(item.requester),
  };
}

export default function AdminPanel() {
  const { provider } = useWallet();

  const [tab, setTab] = useState("doctors");
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [pharmacyRequests, setPharmacyRequests] = useState([]);
  const [verifiedEntities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const loadRequests = async () => {
    try {
      if (!provider) return;

      setLoading(true);
      setTxStatus(null);
      setTxMessage("");

      const contract = getContract(provider);

      const doctors = await contract.getPendingDoctorRequests();
      const pharmacies = await contract.getPendingPharmacyRequests();

      setDoctorRequests(doctors.map((item, index) => normalizeRequest(item, index)));
      setPharmacyRequests(
        pharmacies.map((item, index) => normalizeRequest(item, index))
      );
    } catch (error) {
      console.error("Failed to load requests:", error);
      setTxStatus("failed");
      setTxMessage(error.reason || error.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [provider]);

  const handleApprove = async (type, request) => {
    try {
      const contract = getContract(provider);

      setTxStatus("pending");
      setTxMessage(`Approving ${request.name}. Please confirm in MetaMask...`);

      const tx =
        type === "doctor"
          ? await contract.approveDoctor(request.id)
          : await contract.approvePharmacy(request.id);

      setTxMessage("Transaction submitted. Waiting for confirmation...");

      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage(`${request.name} approved successfully.`);

      await loadRequests();
    } catch (error) {
      console.error("Approval failed:", error);
      setTxStatus("failed");
      setTxMessage(error.reason || error.message || "Approval failed.");
    }
  };

  const handleReject = async (type, request) => {
    const reason = window.prompt(
      `Enter rejection reason for ${request.name}:`,
      "Invalid or incomplete supporting document"
    );

    if (!reason) return;

    try {
      const contract = getContract(provider);

      setTxStatus("pending");
      setTxMessage(`Rejecting ${request.name}. Please confirm in MetaMask...`);

      const tx =
        type === "doctor"
          ? await contract.rejectDoctor(request.id, reason)
          : await contract.rejectPharmacy(request.id, reason);

      setTxMessage("Transaction submitted. Waiting for confirmation...");

      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage(`${request.name} rejected successfully.`);

      await loadRequests();
    } catch (error) {
      console.error("Rejection failed:", error);
      setTxStatus("failed");
      setTxMessage(error.reason || error.message || "Rejection failed.");
    }
  };

  const data = tab === "doctors" ? doctorRequests : pharmacyRequests;
  const type = tab === "doctors" ? "doctor" : "pharmacy";

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Admin Panel"
        subtitle="Approve, reject, or revoke doctors and pharmacies (KKM/MMC authority)."
        icon={<ShieldCheck size={22} />}
      />

      <Card>
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:mb-6 sm:pb-4">
          <div className="flex gap-1.5 overflow-x-auto sm:gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:text-sm ${
                  tab === t.key
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-inset ring-brand-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {t.icon}
                {t.label}
                {t.key !== "revocations" && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs ${
                      tab === t.key
                        ? "bg-brand-200 text-brand-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {t.key === "doctors"
                      ? doctorRequests.length
                      : pharmacyRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div>
            <button
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading..." : "Refresh Requests"}
            </button>
          </div>
        </div>

        {tab !== "revocations" ? (
          loading ? (
            <EmptyState message="Loading pending requests from smart contract..." />
          ) : data.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Request ID
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        License No.
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Wallet
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Submitted
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                      <tr
                        key={`${type}-${item.id}`}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3.5">
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {item.id}
                          </code>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {item.name}
                        </td>

                        <td className="px-4 py-3.5">
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {item.license}
                          </code>
                        </td>

                        <td
                          className="px-4 py-3.5 font-mono text-xs text-slate-500"
                          title={item.requester}
                        >
                          {item.wallet}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500">
                          {item.date}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge type="pending">Pending</Badge>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(type, item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                            >
                              <Check size={14} />
                              Approve
                            </button>

                            <button
                              onClick={() => handleReject(type, item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100"
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {data.map((item) => (
                  <div
                    key={`${type}-${item.id}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Request ID: {item.id} · {item.date}
                        </p>
                      </div>
                      <Badge type="pending">Pending</Badge>
                    </div>

                    <div className="mb-3 space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">License</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                          {item.license}
                        </code>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Wallet</span>
                        <span className="font-mono text-xs text-slate-600">
                          {item.wallet}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">IPFS CID</span>
                        <span className="max-w-[160px] truncate font-mono text-xs text-slate-600">
                          {item.ipfsCID}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(type, item)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                      >
                        <Check size={14} />
                        Approve
                      </button>

                      <button
                        onClick={() => handleReject(type, item)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="No pending requests found on the smart contract." />
          )
        ) : (
          <div>
            {verifiedEntities.length > 0 ? (
              <div className="space-y-3">
                {verifiedEntities.map((entity) => (
                  <div
                    key={entity.wallet}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          entity.type === "doctor"
                            ? "bg-brand-50 text-brand-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {entity.type === "doctor" ? (
                          <UserCheck size={18} />
                        ) : (
                          <Building2 size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {entity.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {entity.license} &middot; {entity.wallet}
                        </p>
                      </div>
                    </div>

                    <button
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100 sm:w-auto"
                    >
                      <Ban size={14} />
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Verified doctors/pharmacies list is not connected yet." />
            )}
          </div>
        )}

        <TxStatus status={txStatus} message={txMessage} />
      </Card>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ShieldCheck size={24} />
      </div>
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}