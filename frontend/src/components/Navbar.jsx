import { Link } from "react-router-dom";
import Button from "./Button";
import useWallet from "../hooks/useWallet";

export default function Navbar() {
  const { account, connectWallet, isWrongNetwork } = useWallet();

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-blue-700">
          RxChain
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link to="/register" className="hover:text-blue-700">Register</Link>
          <Link to="/admin" className="hover:text-blue-700">Admin</Link>
          <Link to="/doctor" className="hover:text-blue-700">Doctor</Link>
          <Link to="/pharmacist" className="hover:text-blue-700">Pharmacist</Link>
          <Link to="/patient" className="hover:text-blue-700">Patient</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isWrongNetwork && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Wrong Network
            </span>
          )}

          {account ? (
            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {shortAddress}
            </span>
          ) : (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
}