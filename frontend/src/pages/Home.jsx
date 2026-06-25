import {
  ShieldCheck,
  FileCheck,
  Pill,
  ArrowRight,
  UserCheck,
  ClipboardList,
  ScanLine,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import useWallet from "../hooks/useWallet";

const stats = [
  { value: "$432B", label: "Counterfeit drug market annually", src: "WHO, 2024" },
  { value: "1M+", label: "Deaths from fake medicines per year", src: "WHO" },
  { value: "10.5%", label: "Medicines in developing countries are substandard", src: "WHO" },
];

const features = [
  {
    icon: <ShieldCheck size={24} />,
    title: "Verified Doctors Only",
    desc: "Only admin-approved doctor wallets can issue prescriptions on-chain.",
  },
  {
    icon: <FileCheck size={24} />,
    title: "Tamper-Proof Records",
    desc: "Prescription hashes stored on-chain — any alteration immediately invalidates them.",
  },
  {
    icon: <Pill size={24} />,
    title: "No Double Dispensing",
    desc: "Smart contract marks prescriptions as DISPENSED — cannot be reused at any pharmacy.",
  },
];

const steps = [
  {
    icon: <UserCheck size={20} />,
    title: "Register",
    desc: "Doctor or pharmacy submits registration request on-chain.",
  },
  {
    icon: <CheckCircle2 size={20} />,
    title: "Admin Approves",
    desc: "KKM/MMC admin verifies credentials and approves on-chain.",
  },
  {
    icon: <ClipboardList size={20} />,
    title: "Issue Prescription",
    desc: "Approved doctor issues a tamper-proof prescription.",
  },
  {
    icon: <ScanLine size={20} />,
    title: "Verify & Dispense",
    desc: "Pharmacist verifies on-chain and dispenses medication once.",
  },
];

export default function Home({ role }) {
  const { account, connectWallet, getRoleRedirectPath } = useWallet();
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="animate-fade-in-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 px-5 py-10 text-white sm:rounded-3xl sm:px-8 sm:py-16 md:px-14 md:py-20">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5" />

          <div className="relative grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm">
                <ShieldCheck size={14} />
                Blockchain Prescription Verification
              </span>

              <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Stop forged prescriptions.
                <br />
                <span className="block mt-2 text-brand-100">Protect every patient.</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm text-brand-100/90 sm:mt-5 sm:text-base md:text-lg">
                RxChain uses smart contracts to verify doctors, issue tamper-proof
                prescriptions, and prevent double dispensing — in real time.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                {account ? (
                  <>
                    {role === "admin" && (
                      <Link to="/admin">
                        <HeroButton>
                          Open Admin Panel
                          <ArrowRight size={16} />
                        </HeroButton>
                      </Link>
                    )}
                    {role === "doctor" && (
                      <Link to="/doctor">
                        <HeroButton>
                          Open Doctor Dashboard
                          <ArrowRight size={16} />
                        </HeroButton>
                      </Link>
                    )}
                    {role === "pharmacy" && (
                      <Link to="/pharmacist">
                        <HeroButton>
                          Open Pharmacist Dashboard
                          <ArrowRight size={16} />
                        </HeroButton>
                      </Link>
                    )}
                    {role === "patient" && (
                      <>
                        <Link to="/patient">
                          <HeroButton>
                            View My Prescriptions
                            <ArrowRight size={16} />
                          </HeroButton>
                        </Link>
                        <Link to="/register">
                          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.97] sm:w-auto">
                            Register as Doctor / Pharmacy
                          </button>
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <HeroButton onClick={async () => {
                      const addr = await connectWallet();
                      if (addr) navigate(getRoleRedirectPath());
                    }}>
                      Connect MetaMask
                      <ArrowRight size={16} />
                    </HeroButton>
                    <Link to="/register">
                      <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.97] sm:w-auto">
                        Register as Doctor / Pharmacy
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="grid gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-sm text-brand-100">{stat.label}</p>
                    <p className="mt-0.5 text-xs text-brand-200/70">{stat.src}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 md:hidden">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold sm:text-xl">{stat.value}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-brand-100 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-fade-in">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
            Why RxChain?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Solving critical prescription fraud problems with blockchain verification.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} hover>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:h-11 sm:w-11 sm:rounded-xl">
                {f.icon}
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 sm:mt-4 sm:text-base">
                {f.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="animate-fade-in">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
            How It Works
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Four simple steps from registration to dispensing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:gap-x-10 sm:gap-y-5 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <Card hover className="relative h-full">
                <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm shadow-brand-600/30 sm:h-10 sm:w-10 sm:text-sm">
                    {i + 1}
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:h-9 sm:w-9">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 sm:mt-1.5 sm:text-sm">
                  {step.desc}
                </p>
              </Card>

              {i < steps.length - 1 && (
                <div className="absolute left-full top-1/2 z-10 hidden w-8 -translate-y-1/2 items-center justify-center md:flex sm:w-10">
                  <ArrowRight size={20} className="text-slate-400" strokeWidth={2.5} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-in">
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 px-5 py-8 text-center sm:px-8 sm:py-10">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
            Ready to get started?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {account
              ? "Jump back into your dashboard."
              : "Connect your MetaMask wallet to register as a doctor or pharmacy, or view your prescriptions."}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:mt-6 sm:flex-row">
            {account ? (
              <>
                {role === "admin" && (
                  <Link to="/admin">
                    <Button className="w-full sm:w-auto">Open Admin Panel</Button>
                  </Link>
                )}
                {role === "doctor" && (
                  <Link to="/doctor">
                    <Button className="w-full sm:w-auto">Open Doctor Dashboard</Button>
                  </Link>
                )}
                {role === "pharmacy" && (
                  <Link to="/pharmacist">
                    <Button className="w-full sm:w-auto">Open Pharmacist Dashboard</Button>
                  </Link>
                )}
                {role === "patient" && (
                  <>
                    <Link to="/patient">
                      <Button className="w-full sm:w-auto">View My Prescriptions</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Register as Doctor / Pharmacy
                      </Button>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button className="w-full sm:w-auto">Register Now</Button>
                </Link>
                <Link to="/patient">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    View Prescriptions
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-lg shadow-brand-900/20 transition-all duration-200 hover:bg-brand-50 active:scale-[0.97] sm:w-auto"
    >
      {children}
    </button>
  );
}
