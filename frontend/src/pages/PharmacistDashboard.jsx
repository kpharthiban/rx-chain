import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";

export default function PharmacistDashboard() {
  const [rxId, setRxId] = useState("");
  const [result, setResult] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const verifyPrescription = () => {
    setResult({
      status: "valid",
      doctor: "Dr. Ahmad",
      drugHash: "0x91f2...ABCD",
      expiry: "5 Jun 2026",
    });
  };

  const dispensePrescription = () => {
    setTxStatus("pending");
    setTxMessage("Waiting for MetaMask confirmation...");

    setTimeout(() => {
      setTxStatus("confirmed");
      setTxMessage("Prescription has been marked as dispensed.");
    }, 1000);
  };

  return (
    <div>
      <PageHeader
        title="Pharmacist Dashboard"
        subtitle="Verify prescription validity and mark medication as dispensed."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Verify Prescription</h2>

          <div className="flex gap-3">
            <input
              value={rxId}
              onChange={(e) => setRxId(e.target.value)}
              placeholder="Enter Prescription ID e.g. 001"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <Button onClick={verifyPrescription}>Verify</Button>
          </div>

          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-emerald-900">Prescription Found</h3>
                <Badge type="valid">Valid</Badge>
              </div>

              <p className="text-sm text-emerald-900">Doctor: {result.doctor}</p>
              <p className="text-sm text-emerald-900">Drug Hash: {result.drugHash}</p>
              <p className="text-sm text-emerald-900">Expiry: {result.expiry}</p>

              <Button className="mt-4" variant="success" onClick={dispensePrescription}>
                Dispense Medication
              </Button>
            </div>
          )}

          <TxStatus status={txStatus} message={txMessage} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Dispensing History</h2>

          <div className="space-y-3">
            {[
              ["#002", "Dr. Siti", "4 Jun 2026"],
              ["#005", "Dr. Ahmad", "2 Jun 2026"],
              ["#007", "Dr. Lee", "1 Jun 2026"],
            ].map(([id, doctor, date]) => (
              <div key={id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{id}</p>
                  <p className="text-sm text-slate-500">{doctor}</p>
                </div>
                <p className="text-sm text-slate-500">{date}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
// // Build the Pharmacist Dashboard UI here
// // Includes: Search by Prescription ID, Verify button, Dispense button, history table
// // Wire up verifyPrescription(), dispensePrescription()

// function PharmacistDashboard() {
//   return <div>Pharmacist Dashboard</div>;
// }

// export default PharmacistDashboard;