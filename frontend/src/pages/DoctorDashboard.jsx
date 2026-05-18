import { FileText, Activity, CheckCircle, Ban } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

export default function DoctorDashboard() {
  return (
    <div>
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Issue blockchain-verified prescriptions and manage prescription records."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Issued" value="12" icon={<FileText />} />
        <StatCard label="Active" value="7" icon={<Activity />} />
        <StatCard label="Dispensed" value="4" icon={<CheckCircle />} />
        <StatCard label="Revoked" value="1" icon={<Ban />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Issue New Prescription</h2>

          <form className="grid gap-4">
            <input className="rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Patient wallet address" />
            <input className="rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Drug name e.g. Ritalin 10mg" />
            <input className="rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Dosage / Frequency e.g. 1x daily" />
            <input className="rounded-xl border border-slate-300 px-4 py-3 text-sm" type="date" />
            <textarea className="rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Extra notes stored off-chain/IPFS" />

            <Button type="submit">Issue Prescription</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">My Prescriptions</h2>

          <div className="space-y-3">
            {[
              ["#001", "0xAB...123", "5 Jun 2026", "active"],
              ["#002", "0xCD...456", "3 Jun 2026", "dispensed"],
              ["#003", "0xEF...789", "1 Jun 2026", "revoked"],
            ].map(([id, patient, expiry, status]) => (
              <div key={id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{id}</p>
                  <p className="text-sm text-slate-500">Patient: {patient}</p>
                  <p className="text-sm text-slate-500">Expiry: {expiry}</p>
                </div>
                <Badge type={status}>{status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


// // Build the Doctor Dashboard UI here
// // Includes: Summary cards, Issue Prescription form, My Prescriptions table

// // Wire up issuePrescription(), getPrescription()

// function DoctorDashboard() {
//   return <div>Doctor Dashboard</div>;
// }

// export default DoctorDashboard;