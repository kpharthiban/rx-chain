import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Menu, X, Wifi, WifiOff, LogOut } from "lucide-react";

import Button from "./Button";
import useWallet from "../hooks/useWallet";

export default function Navbar({ role = "patient", roleLoading = false }) {
  const { account, connectWallet, disconnectWallet, isWrongNetwork, isTestNetwork } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  const links = getLinksForRole(role);

  const handleDisconnect = () => {
    if (disconnectWallet) {
      disconnectWallet();
    }

    setMobileOpen(false);
    navigate("/");
  };

  const handleConnect = async () => {
    const addr = await connectWallet();

    if (addr) {
      if (role === "admin") navigate("/admin");
      else if (role === "doctor") navigate("/doctor");
      else if (role === "pharmacy") navigate("/pharmacist");
      else navigate("/patient");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm shadow-brand-600/30 transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9 sm:rounded-xl">
            <Shield size={16} className="text-white" />
          </div>

          <span className="text-base font-bold text-slate-900 sm:text-lg">
            Rx<span className="text-brand-600">Chain</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {account && links.map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {roleLoading && (
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 md:inline-flex">
              Checking role...
            </span>
          )}

          {!roleLoading && role && role !== "unregistered" && account && (
            <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700 ring-1 ring-inset ring-brand-100 md:inline-flex">
              {role}
            </span>
          )}

          {account && (
            <div className="hidden items-center gap-1.5 md:flex">
              {isWrongNetwork ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  <WifiOff size={12} />
                  Wrong Network
                </span>
              ) : isTestNetwork ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                  <WifiOff size={12} />
                  Test Network
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <Wifi size={12} />
                  Sepolia
                </span>
              )}
            </div>
          )}

          {account ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm">
                <div className={`h-2 w-2 rounded-full ${isWrongNetwork ? "bg-red-500" : isTestNetwork ? "bg-amber-400" : "bg-emerald-500"}`} />
                {shortAddress}
              </div>

              <button
                onClick={handleDisconnect}
                title="Disconnect wallet"
                className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:p-2"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Button onClick={handleConnect} size="sm">
              Connect Wallet
            </Button>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-slide-up border-t border-slate-200/80 bg-white px-4 pb-4 pt-3 md:hidden">
          {account && isWrongNetwork && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <WifiOff size={12} />
              Wrong network — please switch to Sepolia
            </div>
          )}

          {account && isTestNetwork && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <WifiOff size={12} />
              Test network — switch to Sepolia for deployed contracts
            </div>
          )}

          {account && !isWrongNetwork && !isTestNetwork && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <Wifi size={12} />
              Connected to Sepolia
            </div>
          )}

          <div className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold capitalize text-brand-700">
            Role: {roleLoading ? "Checking..." : role}
          </div>

          <nav className="flex flex-col gap-0.5">
            {links.map((link) => {
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {account && (
              <button
                onClick={handleDisconnect}
                className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={18} />
                Disconnect Wallet
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function getLinksForRole(role) {
  if (role === "admin") {
    return [{ to: "/admin", label: "Admin Panel" }];
  }

  if (role === "doctor") {
    return [{ to: "/doctor", label: "Doctor Dashboard" }];
  }

  if (role === "pharmacy") {
    return [{ to: "/pharmacist", label: "Pharmacist Dashboard" }];
  }

  return [{ to: "/patient", label: "My Prescriptions" }];
}
