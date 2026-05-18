import { QRCodeCanvas } from "qrcode.react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import useWallet from "../hooks/useWallet";

export default function PatientView() {
  const { account, connectWallet } = useWallet();

  const prescriptions = [
    {
      id: "001",
      doctor: "Dr. Ahmad",
      drug: "Ritalin 10mg",
      expiry: "5 Jun 2026",
      status: "active",
    },
    {
      id: "002",
      doctor: "Dr. Siti",
      drug: "Amoxicillin 500mg",
      expiry: "3 Jun 2026",
      status: "dispensed",
    },
    {
      id: "003",
      doctor: "Dr. Ahmad",
      drug: "Ritalin 10mg",
      expiry: "Revoked",
      status: "revoked",
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Prescriptions"
        subtitle="View prescriptions issued to your connected wallet."
      />

      {!account ? (
        <Card className="text-center">
          <h2 className="text-lg font-bold text-slate-900">Connect Wallet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Connect your MetaMask wallet to view your prescriptions.
          </p>
          <Button className="mt-4" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-slate-500">Connected Patient Wallet</p>
            <p className="mt-1 font-semibold text-slate-900">{account}</p>
          </Card>

          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">Rx #{rx.id}</h3>
                    <Badge type={rx.status}>{rx.status}</Badge>
                  </div>

                  <p className="text-sm text-slate-600">Doctor: {rx.doctor}</p>
                  <p className="text-sm text-slate-600">Drug: {rx.drug}</p>
                  <p className="text-sm text-slate-600">Expiry: {rx.expiry}</p>

                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => navigator.clipboard.writeText(rx.id)}
                  >
                    Copy Prescription ID
                  </Button>
                </div>

                {rx.status === "active" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <QRCodeCanvas value={rx.id} size={100} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// // Build the Patient View UI here
// // Includes: List of prescriptions for connected wallet, QR code per active prescription

// // Wire up getPrescription() filtered by patient address

// function PatientView() {
//   return <div>Patient View</div>;
// }

// export default PatientView;