import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";

import Navbar from "./components/Navbar";
import NetworkWarning from "./components/NetworkWarning";
import Button from "./components/Button";
import useWallet from "./hooks/useWallet";
import { detectRole, getContract } from "./utils/detectRole";

import Home from "./pages/Home";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import DoctorDashboard from "./pages/DoctorDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import PatientView from "./pages/PatientView";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileQuestion size={32} />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-900">
        Page Not Found
      </h1>

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}

function RegisterGuard({ role, children }) {
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "doctor") return <Navigate to="/doctor" replace />;
  if (role === "pharmacy") return <Navigate to="/pharmacist" replace />;
  return children;
}

function ProtectedRoute({ children, allowedRoles, role, account, appReady }) {
  if (!appReady) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-slate-500">
          Checking wallet role...
        </p>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { account, provider, walletLoading, isWrongNetwork, isTestNetwork } = useWallet();

  const [role, setRole] = useState("unregistered");
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (walletLoading) {
      setAppReady(false);
      return;
    }

    if (!account || !provider) {
      setRole("unregistered");
      setAppReady(true);
      return;
    }

    if (isWrongNetwork || isTestNetwork) {
      setRole("unregistered");
      setAppReady(true);
      return;
    }

    setAppReady(false);

    async function loadRole() {
      try {
        const contract = getContract(provider);
        const detectedRole = await detectRole(contract, account);
        setRole(detectedRole);
      } catch (error) {
        console.error("Failed to detect role:", error);
        setRole("unregistered");
      } finally {
        setAppReady(true);
      }
    }

    loadRole();
  }, [account, provider, walletLoading]);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#f8fafb]">
        <Navbar role={role} roleLoading={!appReady} />
        <NetworkWarning />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home role={role} roleLoading={!appReady} />} />
            <Route path="/register" element={<RegisterGuard role={role}><Register /></RegisterGuard>} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  role={role}
                  account={account}
                  appReady={appReady}
                >
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute
                  allowedRoles={["doctor"]}
                  role={role}
                  account={account}
                  appReady={appReady}
                >
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacist"
              element={
                <ProtectedRoute
                  allowedRoles={["pharmacy"]}
                  role={role}
                  account={account}
                  appReady={appReady}
                >
                  <PharmacistDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient"
              element={
                <ProtectedRoute
                  allowedRoles={["patient", "unregistered"]}
                  role={role}
                  account={account}
                  appReady={appReady}
                >
                  <PatientView />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}