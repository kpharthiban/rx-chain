import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import DoctorDashboard from "./pages/DoctorDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import PatientView from "./pages/PatientView";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#f8fafb]">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/pharmacist" element={<PharmacistDashboard />} />
            <Route path="/patient" element={<PatientView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
