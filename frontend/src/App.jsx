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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-8">
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




// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";
// import AdminPanel from "./pages/AdminPanel";
// import Register from "./pages/Register";
// import DoctorDashboard from "./pages/DoctorDashboard";
// import PharmacistDashboard from "./pages/PharmacistDashboard";
// import PatientView from "./pages/PatientView";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/admin" element={<AdminPanel />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/doctor" element={<DoctorDashboard />} />
//         <Route path="/pharmacist" element={<PharmacistDashboard />} />
//         <Route path="/patient" element={<PatientView />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

