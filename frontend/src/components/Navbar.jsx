import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Menu, X, Wifi, WifiOff, LogOut } from "lucide-react";
import Button from "./Button";
import useWallet from "../hooks/useWallet";
import useRoles from "../hooks/useRoles";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const ADMIN_WALLET = "0x0000000000000000000000000000000000000000";

export default function Navbar() {
  const { account, chainId, connectWallet, disconnectWallet, getRoleRedirectPath } = useWallet();
  const { isDoctor, isPharmacist } = useRoles(account);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  const isWrongNetwork = account && chainId && chainId !== SEPOLIA_CHAIN_ID;
  const isAdmin =
    account && account.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const links = getLinksForRole(account, isAdmin, isDoctor, isPharmacist);

  const handleDisconnect = () => {
    disconnectWallet();
    setMobileOpen(false);
    navigate("/");
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
          {links.map((link) => {
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
          {account && (
            <div className="hidden items-center gap-1.5 md:flex">
              {isWrongNetwork ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  <WifiOff size={12} />
                  Wrong Network
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
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
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
            <Button onClick={async () => {
              const addr = await connectWallet();
              if (addr) navigate(getRoleRedirectPath());
            }} size="sm">
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
              Please switch to Sepolia Testnet
            </div>
          )}

          {account && !isWrongNetwork && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <Wifi size={12} />
              Connected to Sepolia
            </div>
          )}

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

function getLinksForRole(account, isAdmin, isDoctor, isPharmacist) {
  if (!account) {
    return [
      { to: "/register", label: "Register" },
      { to: "/patient", label: "Patient" },
    ];
  }

  if (isAdmin) {
    return [{ to: "/admin", label: "Admin Panel" }];
  }

  if (isDoctor) {
    return [{ to: "/doctor", label: "Doctor" }];
  }
  if (isPharmacist) {
    return [{ to: "/pharmacist", label: "Pharmacist" }];
  }

  return [
    { to: "/patient", label: "My Prescriptions" },
    { to: "/register", label: "Register" },
  ];
}
