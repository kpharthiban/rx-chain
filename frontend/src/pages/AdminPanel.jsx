import { useState } from "react";
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
    status: "pending",
  },
  {
    id: 2,
    name: "Dr. Siti",
    license: "MMC-67890",
    wallet: "0x5678...EFGH",
    status: "pending",
  },
];

const pharmacyRequests = [
  {
    id: 1,
    name: "RxCare Pharmacy",
    license: "PBM-22331",
    wallet: "0x9876...WXYZ",
    status: "pending",
  },
];

export default function AdminPanel() {
  const [tab, setTab] = useState("doctors");
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const handleAction = (action, name) => {
    setTxStatus("pending");
    setTxMessage(`${action} transaction is waiting for MetaMask confirmation...`);

    setTimeout(() => {
      setTxStatus("confirmed");
      setTxMessage(`${name} has been ${action.toLowerCase()} successfully.`);
    }, 1000);
  };

  const data = tab === "doctors" ? doctorRequests : pharmacyRequests;

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Approve, reject, or revoke doctors and pharmacies."
      />

      <Card>
        <div className="mb-6 flex gap-3">
          <Button
            variant={tab === "doctors" ? "primary" : "secondary"}
            onClick={() => setTab("doctors")}
          >
            Doctor Requests
          </Button>

          <Button
            variant={tab === "pharmacies" ? "primary" : "secondary"}
            onClick={() => setTab("pharmacies")}
          >
            Pharmacy Requests
          </Button>

          <Button
            variant={tab === "revocations" ? "primary" : "secondary"}
            onClick={() => setTab("revocations")}
          >
            Revocations
          </Button>
        </div>

        {tab !== "revocations" ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">License No.</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3">{item.license}</td>
                    <td className="px-4 py-3">{item.wallet}</td>
                    <td className="px-4 py-3">
                      <Badge type="pending">Pending</Badge>
                    </td>
                    <td className="space-x-2 px-4 py-3">
                      <Button
                        variant="success"
                        onClick={() => handleAction("Approve", item.name)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleAction("Reject", item.name)}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="bg-slate-50">
            <h3 className="font-bold text-slate-900">Verified Entities</h3>
            <p className="mt-1 text-sm text-slate-500">
              This section will list approved doctors and pharmacies for revocation.
            </p>
          </Card>
        )}

        <TxStatus status={txStatus} message={txMessage} />
      </Card>
    </div>
  );
}


// // Build the Admin Panel UI here
// // Includes: Doctor Requests tab, Pharmacy Requests tab, Revocation tab

// // Wire up approveDoctor(), rejectDoctor(), approvePharmacy(), rejectPharmacy()

// function AdminPanel() {
//   return <div>Admin Panel</div>;
// }

// export default AdminPanel;