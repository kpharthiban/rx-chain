import { useState, useEffect } from "react";
import { UserPlus, Building2, Wallet, Clock, CheckCircle2, XCircle, Ban, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import TxStatus from "../components/TxStatus";
import useWallet from "../hooks/useWallet";
import { getContract } from "../utils/detectRole";
import { uploadFileToIPFS } from "../utils/ipfs";

export default function Register() {
  const { account, provider, connectWallet } = useWallet();

  const [tab, setTab] = useState("doctor");
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState("");

  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    licenseNumber: "",
    specialization: "",
    supportingFile: null,
  });

  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    licenseNumber: "",
    address: "",
    supportingFile: null,
  });

  useEffect(() => {
    async function checkRegistrationStatus() {
      if (!account || !provider) {
        setRegistrationStatus(null);
        return;
      }

      setStatusLoading(true);

      try {
        const contract = getContract(provider);

        const doctorEvents = await contract.queryFilter(
          contract.filters.DoctorRegistrationRequested(null, account)
        );

        if (doctorEvents.length > 0) {
          const lastEvent = doctorEvents[doctorEvents.length - 1];
          const requestId = lastEvent.args.requestId ?? lastEvent.args[0];
          const request = await contract.doctorRequests(requestId);
          const status = request.status;

          if (status === 0) {
            setRegistrationStatus("pending");
            setRegistrationType("doctor");
          } else if (status === 1) {
            const isStillVerified = await contract.verifiedDoctors(account);
            if (isStillVerified) {
              setRegistrationStatus("approved");
              setRegistrationType("doctor");
            } else {
              setRegistrationStatus("revoked");
              setRegistrationType("doctor");
            }
          } else if (status === 2) {
            setRegistrationStatus("rejected");
            setRegistrationType("doctor");
            setRejectionReason(request.rejectionReason);
          }

          setStatusLoading(false);
          return;
        }

        const pharmacyEvents = await contract.queryFilter(
          contract.filters.PharmacyRegistrationRequested(null, account)
        );

        if (pharmacyEvents.length > 0) {
          const lastEvent = pharmacyEvents[pharmacyEvents.length - 1];
          const requestId = lastEvent.args.requestId ?? lastEvent.args[0];
          const request = await contract.pharmacyRequests(requestId);
          const status = request.status;

          if (status === 0) {
            setRegistrationStatus("pending");
            setRegistrationType("pharmacy");
          } else if (status === 1) {
            const isStillVerified = await contract.verifiedPharmacies(account);
            if (isStillVerified) {
              setRegistrationStatus("approved");
              setRegistrationType("pharmacy");
            } else {
              setRegistrationStatus("revoked");
              setRegistrationType("pharmacy");
            }
          } else if (status === 2) {
            setRegistrationStatus("rejected");
            setRegistrationType("pharmacy");
            setRejectionReason(request.rejectionReason);
          }

          setStatusLoading(false);
          return;
        }

        setRegistrationStatus("none");
      } catch (error) {
        console.error("Failed to check registration status:", error);
        setRegistrationStatus("none");
      } finally {
        setStatusLoading(false);
      }
    }

    checkRegistrationStatus();
  }, [account, provider]);

  const handleDoctorChange = (e) => {
    const { name, value, files } = e.target;

    setDoctorForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handlePharmacyChange = (e) => {
    const { name, value, files } = e.target;

    setPharmacyForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!account) {
        throw new Error("Please connect your wallet first.");
      }

      if (!provider) {
        throw new Error("Wallet provider is not available. Please reconnect MetaMask.");
      }

      const form = tab === "doctor" ? doctorForm : pharmacyForm;

      if (!form.supportingFile) {
        throw new Error("Please upload a supporting document.");
      }

      setTxStatus("pending");
      setTxMessage("Uploading supporting document to IPFS...");

      const ipfsResult = await uploadFileToIPFS(form.supportingFile);

      setTxMessage("Document uploaded to IPFS. Please confirm transaction in MetaMask...");

      const contract = getContract(provider);

      let tx;

      if (tab === "doctor") {
        tx = await contract.requestDoctorRegistration(
          doctorForm.name,
          doctorForm.licenseNumber,
          ipfsResult.cid
        );
      } else {
        tx = await contract.requestPharmacyRegistration(
          pharmacyForm.name,
          pharmacyForm.licenseNumber,
          ipfsResult.cid
        );
      }

      setTxMessage("Transaction submitted. Waiting for blockchain confirmation...");

      await tx.wait();

      setTxStatus("confirmed");
      setTxMessage(
        `${tab === "doctor" ? "Doctor" : "Pharmacy"} registration request submitted successfully. IPFS CID: ${ipfsResult.cid}`
      );

      setRegistrationStatus("pending");
      setRegistrationType(tab);

      if (tab === "doctor") {
        setDoctorForm({
          name: "",
          licenseNumber: "",
          specialization: "",
          supportingFile: null,
        });
      } else {
        setPharmacyForm({
          name: "",
          licenseNumber: "",
          address: "",
          supportingFile: null,
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setTxStatus("failed");
      setTxMessage(error.reason || error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Registration Request"
        subtitle="Submit your doctor or pharmacy verification request for admin approval."
        icon={<UserPlus size={22} />}
      />

      {!account && (
        <Card className="mb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Wallet size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Connect your wallet first
                </h3>
                <p className="text-sm text-slate-500">
                  Your wallet address will be used as your blockchain identity.
                </p>
              </div>
            </div>

            <Button onClick={connectWallet} size="sm">
              Connect Wallet
            </Button>
          </div>
        </Card>
      )}

      {statusLoading && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 py-4 text-sm font-semibold text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            Checking registration status...
          </div>
        </Card>
      )}

      {registrationStatus === "pending" && (
        <Card>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock size={28} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Registration Pending
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-600">
              Your {registrationType} registration request has been submitted and is awaiting admin approval.
            </p>

            <p className="mt-3 max-w-md text-xs text-slate-400">
              The admin (KKM/MMC) will review your credentials and supporting documents.
            </p>
          </div>
        </Card>
      )}

      {registrationStatus === "approved" && (
        <Card>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Registration Approved
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-600">
              Your {registrationType} registration has been approved. You can access your dashboard now.
            </p>

            <Link
              to={registrationType === "doctor" ? "/doctor" : "/pharmacist"}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-all duration-200 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/30 active:scale-[0.97]"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      )}

      {registrationStatus === "rejected" && (
        <Card className="mb-6">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={28} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Registration Rejected
            </h2>

            {rejectionReason && (
              <p className="mt-2 max-w-md rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                Reason: {rejectionReason}
              </p>
            )}

            <p className="mt-3 max-w-md text-sm text-slate-500">
              You may submit a new registration request with corrected information.
            </p>
          </div>
        </Card>
      )}

      {registrationStatus === "revoked" && (
        <Card>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Ban size={28} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Registration Revoked
            </h2>

            <span className="mt-2 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Revoked
            </span>

            <p className="mt-3 max-w-md text-sm text-slate-600">
              Your {registrationType} registration has been revoked by the admin (KKM/MMC). Your on-chain role has been removed.
            </p>

            <p className="mt-3 max-w-md text-xs text-slate-400">
              If you believe this was in error, please contact KKM/MMC through official channels for clarification.
            </p>
          </div>
        </Card>
      )}

      {account && (registrationStatus === "none" || registrationStatus === "rejected" || registrationStatus === null) && !statusLoading && (
      <Card>
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1 sm:mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("doctor");
              setTxStatus(null);
              setTxMessage("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
              tab === "doctor"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus size={14} className="sm:hidden" />
            <UserPlus size={16} className="hidden sm:block" />
            Register as Doctor
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("pharmacy");
              setTxStatus(null);
              setTxMessage("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
              tab === "pharmacy"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 size={14} className="sm:hidden" />
            <Building2 size={16} className="hidden sm:block" />
            Register as Pharmacy
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <FormField label="Wallet Address">
            <input
              value={account || "Connect wallet to auto-fill address"}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </FormField>

          {tab === "doctor" ? (
            <>
              <FormField label="Full Name">
                <input
                  required
                  name="name"
                  value={doctorForm.name}
                  onChange={handleDoctorChange}
                  placeholder="Dr. Ahmad"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="MMC Registration Number">
                <input
                  required
                  name="licenseNumber"
                  value={doctorForm.licenseNumber}
                  onChange={handleDoctorChange}
                  placeholder="e.g. MMC12345"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Specialization">
                <input
                  required
                  name="specialization"
                  value={doctorForm.specialization}
                  onChange={handleDoctorChange}
                  placeholder="General Practitioner"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Supporting Document">
                <input
                  required
                  name="supportingFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleDoctorChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Upload MMC certificate or supporting document. This will be stored on IPFS/Pinata.
                </p>
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Pharmacy Name">
                <input
                  required
                  name="name"
                  value={pharmacyForm.name}
                  onChange={handlePharmacyChange}
                  placeholder="RxCare Pharmacy"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Type A Poison License Number">
                <input
                  required
                  name="licenseNumber"
                  value={pharmacyForm.licenseNumber}
                  onChange={handlePharmacyChange}
                  placeholder="e.g. KL0045/2024"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Pharmacy Address">
                <input
                  required
                  name="address"
                  value={pharmacyForm.address}
                  onChange={handlePharmacyChange}
                  placeholder="Kuala Lumpur, Malaysia"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </FormField>

              <FormField label="Supporting Document">
                <input
                  required
                  name="supportingFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handlePharmacyChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Upload pharmacy licence or supporting document. This will be stored on IPFS/Pinata.
                </p>
              </FormField>
            </>
          )}

          <Button type="submit" disabled={!account || txStatus === "pending"}>
            {txStatus === "pending"
              ? "Submitting..."
              : "Submit Registration Request"}
          </Button>
        </form>

        <TxStatus status={txStatus} message={txMessage} />
      </Card>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}