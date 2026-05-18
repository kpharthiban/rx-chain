import { ShieldCheck, FileCheck, Pill, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import useWallet from "../hooks/useWallet";

export default function Home() {
  const { account, connectWallet, isWrongNetwork } = useWallet();

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-10 rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 px-8 py-14 text-white md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-100">
            Blockchain Prescription Verification
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Stop forged prescriptions and double dispensing.
          </h1>

          <p className="mt-5 max-w-xl text-blue-100">
            RxChain uses smart contracts to verify doctors, issue tamper-proof prescriptions,
            and allow pharmacists to dispense medication only once.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {account ? (
              <Link to="/patient">
                <Button variant="secondary">Open Dashboard</Button>
              </Link>
            ) : (
              <Button onClick={connectWallet} variant="secondary">
                Connect MetaMask
              </Button>
            )}

            <Link to="/register">
              <Button className="bg-white/10 text-white hover:bg-white/20">
                Register as Doctor / Pharmacy
              </Button>
            </Link>
          </div>

          {isWrongNetwork && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Please switch MetaMask to Sepolia Testnet.
            </div>
          )}
        </div>

        <Card className="bg-white/10 text-white backdrop-blur">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-blue-100">Main Goal</p>
              <p className="mt-1 text-lg font-bold">Tamper-proof prescription verification</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-blue-100">Network</p>
              <p className="mt-1 text-lg font-bold">Ethereum Sepolia Testnet</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-blue-100">Storage</p>
              <p className="mt-1 text-lg font-bold">On-chain hash + IPFS data</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <ShieldCheck className="mb-4 text-blue-600" size={32} />
          <h3 className="text-lg font-bold text-slate-900">Verified Doctors</h3>
          <p className="mt-2 text-sm text-slate-600">
            Only admin-approved doctor wallets can issue prescriptions.
          </p>
        </Card>

        <Card>
          <FileCheck className="mb-4 text-blue-600" size={32} />
          <h3 className="text-lg font-bold text-slate-900">Tamper-Proof Records</h3>
          <p className="mt-2 text-sm text-slate-600">
            Prescription hashes are stored on-chain to detect alteration.
          </p>
        </Card>

        <Card>
          <Pill className="mb-4 text-blue-600" size={32} />
          <h3 className="text-lg font-bold text-slate-900">No Double Dispensing</h3>
          <p className="mt-2 text-sm text-slate-600">
            Once dispensed, the smart contract prevents reuse.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How It Works</h2>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            "Doctor or pharmacy registers",
            "Admin approves the wallet",
            "Doctor issues prescription",
            "Pharmacist verifies and dispenses",
          ].map((item, index) => (
            <Card key={item}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {index + 1}
              </div>
              <p className="font-semibold text-slate-800">{item}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}




// // Build the landing page UI here
// // Includes: Hero section, Connect Wallet button, network warning banner,
// //           role detection after connect, Register as Doctor/Pharmacy buttons

// function Home() {
//   return <div>Home Page</div>;
// }

// export default Home;