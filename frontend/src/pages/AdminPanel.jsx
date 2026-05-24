import { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Ban,
  Users,
  Check,
  X,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";

const doctorRequests = [
  {
    id: 1,
    name: "Dr. Ahmad",
    license: "MMC-12345",
    wallet: "0x1234...ABCD",
    date: "22 May 2026",
    status: "pending",
  },
  {
    id: 2,
    name: "Dr. Siti",
    license: "MMC-67890",
    wallet: "0x5678...EFGH",
    date: "21 May 2026",
    status: "pending",
  },
];

const pharmacyRequests = [
  {
    id: 1,
    name: "RxCare Pharmacy",
    license: "PBM-22331",
    wallet: "0x9876...WXYZ",
    date: "20 May 2026",
    status: "pending",
  },
];

const verifiedEntities = [
  {
    name: "Dr. Lee",
    type: "doctor",
    license: "MMC-11111",
    wallet: "0xAAAA...1111",
  },
  {
    name: "MedPlus Pharmacy",
    type: "pharmacy",
    license: "PBM-99999",
    wallet: "0xBBBB...2222",
  },
];

const tabs = [
  { key: "doctors", label: "Doctors", icon: <UserCheck size={16} /> },
  { key: "pharmacies", label: "Pharmacies", icon: <Building2 size={16} /> },
  { key: "revocations", label: "Verified", icon: <Users size={16} /> },
];

export default function AdminPanel() {
  const [tab, setTab] = useState("doctors");
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");
  const [detailModal, setDetailModal] = useState(null);

  const handleAction = (action, name) => {
    setDetailModal(null);
    setTxStatus("pending");
    setTxMessage(`${action} transaction is waiting for MetaMask confirmation...`);
    setTimeout(() => {
      setTxStatus("confirmed");
      setTxMessage(`${name} has been ${action.toLowerCase()}d successfully.`);
    }, 1000);
  };

  const data = tab === "doctors" ? doctorRequests : pharmacyRequests;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Admin Panel"
        subtitle="Approve, reject, or revoke doctors and pharmacies (KKM/MMC authority)."
        icon={<ShieldCheck size={22} />}
      />

      <Card>
        <div className="mb-5 flex gap-1.5 overflow-x-auto border-b border-slate-200 pb-3 sm:mb-6 sm:gap-2 sm:pb-4">
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

        {tab !== "revocations" ? (
          data.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
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
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {item.license}
                          </code>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
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
                              onClick={() =>
                                handleAction("Approve", item.name)
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleAction("Reject", item.name)
                              }
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

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {data.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.date}
                        </p>
                      </div>
                      <Badge type="pending">Pending</Badge>
                    </div>

                    <div className="mb-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">License</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                          {item.license}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wallet</span>
                        <span className="font-mono text-xs text-slate-600">
                          {item.wallet}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction("Approve", item.name)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction("Reject", item.name)}
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
            <EmptyState message="No pending requests." />
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
                      onClick={() => handleAction("Revoke", entity.name)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100 sm:w-auto"
                    >
                      <Ban size={14} />
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No verified entities yet." />
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
