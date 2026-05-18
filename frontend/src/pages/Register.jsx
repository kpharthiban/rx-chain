import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";

export default function Register() {
  const { account, connectWallet } = useWallet();
  const [tab, setTab] = useState("doctor");
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setTxStatus("pending");
      setTxMessage("Waiting for MetaMask confirmation...");

      // Later Derrel can connect this to:
      // requestDoctorRegistration()
      // requestPharmacyRegistration()

      setTimeout(() => {
        setTxStatus("confirmed");
        setTxMessage("Registration request submitted successfully.");
      }, 1000);
    } catch (error) {
      setTxStatus("failed");
      setTxMessage("Registration failed. Please try again.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Registration Request"
        subtitle="Submit your doctor or pharmacy verification request for admin approval."
      />

      {!account && (
        <Card className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Connect your wallet first</h3>
            <p className="text-sm text-slate-500">
              Your wallet address will be used as your blockchain identity.
            </p>
          </div>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </Card>
      )}

      <Card>
        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setTab("doctor")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "doctor" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Register as Doctor
          </button>

          <button
            onClick={() => setTab("pharmacy")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === "pharmacy" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Register as Pharmacy
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Wallet Address
            </label>
            <input
              value={account || "Connect wallet to auto-fill address"}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>

          {tab === "doctor" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  placeholder="Dr. Ahmad"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  MMC Registration Number
                </label>
                <input
                  placeholder="MMC-12345"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Specialization
                </label>
                <input
                  placeholder="General Practitioner"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pharmacy Name
                </label>
                <input
                  placeholder="RxCare Pharmacy"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pharmacy Board Registration Number
                </label>
                <input
                  placeholder="PBM-67890"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pharmacy Address
                </label>
                <input
                  placeholder="Kuala Lumpur, Malaysia"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Supporting Document
            </label>
            <input
              type="file"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Later this can be uploaded to IPFS/Pinata.
            </p>
          </div>

          <Button type="submit" disabled={!account}>
            Submit Registration Request
          </Button>
        </form>

        <TxStatus status={txStatus} message={txMessage} />
      </Card>
    </div>
  );
}



// // Build the Registration page UI here
// // Includes: Register as Doctor tab, Register as Pharmacy tab, status tracker

// // Wire up requestDoctorRegistration(), requestPharmacyRegistration()

// function Register() {
//   return <div>Register Page</div>;
// }

// export default Register;