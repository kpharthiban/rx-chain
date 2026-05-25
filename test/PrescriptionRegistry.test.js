// PrescriptionRegistry — Complete Test Suite (Phase 2)
// Run with: npx hardhat test
// Coverage target: >=90% (Exceeds band)
// Gas reporter: hardhat-gas-reporter (auto-runs with tests)

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrescriptionRegistry", function () {

  // ─── SHARED SETUP ────────────────────────────────────────────────────────────
  let contract;
  let admin, doctor1, doctor2, pharmacy1, pharmacy2, patient1, patient2, stranger;

  beforeEach(async function () {
    [admin, doctor1, doctor2, pharmacy1, pharmacy2, patient1, patient2, stranger] =
      await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PrescriptionRegistry");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
  async function setupApprovedDoctor1() {
    await contract.connect(doctor1)
      .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://doctor1");
    await contract.connect(admin).approveDoctor(0);
  }

  async function setupApprovedDoctor2() {
    await contract.connect(doctor2)
      .requestDoctorRegistration("Dr. Priya", "MMC67890", "ipfs://doctor2");
    const count = Number(await contract.doctorRequestCount());
    await contract.connect(admin).approveDoctor(count - 1);
  }

  async function setupApprovedPharmacy1() {
    await contract.connect(pharmacy1)
      .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://pharmacy1");
    await contract.connect(admin).approvePharmacy(0);
  }

  async function setupApprovedPharmacy2() {
    await contract.connect(pharmacy2)
      .requestPharmacyRegistration("Caring Pharmacy", "PHR002", "ipfs://pharmacy2");
    const count = Number(await contract.pharmacyRequestCount());
    await contract.connect(admin).approvePharmacy(count - 1);
  }

  async function setupIssuedPrescription() {
    await setupApprovedDoctor1();
    await setupApprovedPharmacy1();
    const expiry = validExpiry();
    await contract.connect(doctor1).issuePrescription(
      patient1.address,
      ethers.encodeBytes32String("rxhash001"),
      "ipfs://rx001",
      expiry
    );
    return expiry;
  }

  function validExpiry() {
    return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  }

  function pastExpiry() {
    return Math.floor(Date.now() / 1000) - 1;
  }

  function over30DaysExpiry() {
    return Math.floor(Date.now() / 1000) + (31 * 24 * 60 * 60);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // A. DOCTOR REGISTRATION — requestDoctorRegistration()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("A. Doctor Registration — requestDoctorRegistration()", function () {

    describe("A1. Happy Path", function () {

      it("should allow any public wallet to submit a doctor registration request", async function () {
        await expect(
          contract.connect(doctor1)
            .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc")
        ).to.not.be.reverted;
      });

      it("should store the request with correct name, licenseNumber, and requester address", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        const request = await contract.doctorRequests(0);
        expect(request.requester).to.equal(doctor1.address);
        expect(request.name).to.equal("Dr. Kumar");
        expect(request.licenseNumber).to.equal("MMC12345");
      });

      it("should set request status to Pending after submission", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        const request = await contract.doctorRequests(0);
        expect(request.status).to.equal(0); // 0 = Pending
      });

      it("should increment doctorRequestCount by 1 after each request", async function () {
        expect(await contract.doctorRequestCount()).to.equal(0);
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        expect(await contract.doctorRequestCount()).to.equal(1);
        await contract.connect(doctor2)
          .requestDoctorRegistration("Dr. Priya", "MMC67890", "ipfs://def");
        expect(await contract.doctorRequestCount()).to.equal(2);
      });

      it("should emit DoctorRegistrationRequested event with correct requestId, requester, and licenseNumber", async function () {
        await expect(
          contract.connect(doctor1)
            .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc")
        )
          .to.emit(contract, "DoctorRegistrationRequested")
          .withArgs(0, doctor1.address, "MMC12345");
      });

    });

    describe("A2. Revert Conditions", function () {

      it("should revert with 'Name cannot be empty' when name is an empty string", async function () {
        await expect(
          contract.connect(doctor1)
            .requestDoctorRegistration("", "MMC12345", "ipfs://abc")
        ).to.be.revertedWith("Name cannot be empty");
      });

      it("should revert with 'License number cannot be empty' when licenseNumber is an empty string", async function () {
        await expect(
          contract.connect(doctor1)
            .requestDoctorRegistration("Dr. Kumar", "", "ipfs://abc")
        ).to.be.revertedWith("License number cannot be empty");
      });

      it("should revert when an already-verified doctor tries to register again", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1)
            .requestDoctorRegistration("Dr. Kumar", "MMC99999", "ipfs://abc")
        ).to.be.revertedWith("Already a verified doctor");
      });

      it("should revert when license number is already registered by another doctor", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).approveDoctor(0);
        await expect(
          contract.connect(doctor2)
            .requestDoctorRegistration("Dr. Priya", "MMC12345", "ipfs://def")
        ).to.be.revertedWith("License number already registered");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // B. DOCTOR APPROVAL — approveDoctor()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("B. Doctor Approval — approveDoctor()", function () {

    describe("B1. Happy Path", function () {

      it("should allow admin to approve a pending doctor request", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(contract.connect(admin).approveDoctor(0)).to.not.be.reverted;
      });

      it("should grant DOCTOR_ROLE to the approved doctor wallet", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).approveDoctor(0);
        const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
        expect(await contract.hasRole(DOCTOR_ROLE, doctor1.address)).to.equal(true);
      });

      it("should set verifiedDoctors[address] to true after approval", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).approveDoctor(0);
        expect(await contract.verifiedDoctors(doctor1.address)).to.equal(true);
      });

      it("should update request status from Pending to Approved", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).approveDoctor(0);
        const request = await contract.doctorRequests(0);
        expect(request.status).to.equal(1); // 1 = Approved
      });

      it("should emit DoctorApproved event with correct requestId and doctor address", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(contract.connect(admin).approveDoctor(0))
          .to.emit(contract, "DoctorApproved")
          .withArgs(0, doctor1.address);
      });

    });

    describe("B2. Access Control", function () {

      beforeEach(async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
      });

      it("should revert when a non-admin (doctor1) tries to approve a doctor request", async function () {
        await expect(contract.connect(doctor1).approveDoctor(0)).to.be.reverted;
      });

      it("should revert when a non-admin (stranger) tries to approve a doctor request", async function () {
        await expect(contract.connect(stranger).approveDoctor(0)).to.be.reverted;
      });

      it("should revert when a non-admin (pharmacy1) tries to approve a doctor request", async function () {
        await expect(contract.connect(pharmacy1).approveDoctor(0)).to.be.reverted;
      });

    });

    describe("B3. Edge Cases", function () {

      it("should revert when approving a requestId that does not exist", async function () {
        await expect(
          contract.connect(admin).approveDoctor(999)
        ).to.be.revertedWith("Request does not exist");
      });

      it("should revert when approving an already approved request", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).approveDoctor(0);
        await expect(
          contract.connect(admin).approveDoctor(0)
        ).to.be.revertedWith("Request is not pending");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C. DOCTOR REJECTION — rejectDoctor()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("C. Doctor Rejection — rejectDoctor()", function () {

    describe("C1. Happy Path", function () {

      it("should allow admin to reject a pending doctor request with a reason", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(
          contract.connect(admin).rejectDoctor(0, "Invalid MMC license")
        ).to.not.be.reverted;
      });

      it("should store the rejection reason in the request struct", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).rejectDoctor(0, "Invalid MMC license");
        const request = await contract.doctorRequests(0);
        expect(request.rejectionReason).to.equal("Invalid MMC license");
      });

      it("should update request status from Pending to Rejected", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).rejectDoctor(0, "Invalid MMC license");
        const request = await contract.doctorRequests(0);
        expect(request.status).to.equal(2); // 2 = Rejected
      });

      it("should emit DoctorRejected event with correct requestId, requester, and reason", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(
          contract.connect(admin).rejectDoctor(0, "Invalid MMC license")
        )
          .to.emit(contract, "DoctorRejected")
          .withArgs(0, doctor1.address, "Invalid MMC license");
      });

    });

    describe("C2. Access Control", function () {

      it("should revert when a non-admin tries to reject a doctor request", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(
          contract.connect(stranger).rejectDoctor(0, "reason")
        ).to.be.reverted;
      });

    });

    describe("C3. Edge Cases", function () {

      it("should revert when rejection reason is an empty string", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await expect(
          contract.connect(admin).rejectDoctor(0, "")
        ).to.be.revertedWith("Rejection reason cannot be empty");
      });

      it("should NOT grant DOCTOR_ROLE to a rejected doctor wallet", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).rejectDoctor(0, "Invalid MMC license");
        const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
        expect(await contract.hasRole(DOCTOR_ROLE, doctor1.address)).to.equal(false);
      });

      it("should set verifiedDoctors[address] to false after rejection", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(admin).rejectDoctor(0, "Invalid MMC license");
        expect(await contract.verifiedDoctors(doctor1.address)).to.equal(false);
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // D. DOCTOR REVOCATION — revokeDoctor()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("D. Doctor Revocation — revokeDoctor()", function () {

    describe("D1. Happy Path", function () {

      it("should allow admin to revoke a previously approved doctor", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(admin).revokeDoctor(doctor1.address)
        ).to.not.be.reverted;
      });

      it("should set verifiedDoctors[address] to false after revocation", async function () {
        await setupApprovedDoctor1();
        await contract.connect(admin).revokeDoctor(doctor1.address);
        expect(await contract.verifiedDoctors(doctor1.address)).to.equal(false);
      });

      it("should revoke DOCTOR_ROLE from the doctor wallet", async function () {
        await setupApprovedDoctor1();
        await contract.connect(admin).revokeDoctor(doctor1.address);
        const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
        expect(await contract.hasRole(DOCTOR_ROLE, doctor1.address)).to.equal(false);
      });

      it("should emit DoctorRevoked event with correct doctor address", async function () {
        await setupApprovedDoctor1();
        await expect(contract.connect(admin).revokeDoctor(doctor1.address))
          .to.emit(contract, "DoctorRevoked")
          .withArgs(doctor1.address);
      });

    });

    describe("D2. Access Control", function () {

      it("should revert when a non-admin tries to revoke a doctor", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(stranger).revokeDoctor(doctor1.address)
        ).to.be.reverted;
      });

      it("should revert when a doctor tries to revoke another doctor", async function () {
        await setupApprovedDoctor1();
        await setupApprovedDoctor2();
        await expect(
          contract.connect(doctor1).revokeDoctor(doctor2.address)
        ).to.be.reverted;
      });

    });

    describe("D3. Post-Revocation Behaviour", function () {

      it("should prevent a revoked doctor from issuing new prescriptions", async function () {
        await setupApprovedDoctor1();
        await contract.connect(admin).revokeDoctor(doctor1.address);
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx",
            validExpiry()
          )
        ).to.be.reverted;
      });

      it("should revert when trying to revoke a wallet that was never a doctor", async function () {
        await expect(
          contract.connect(admin).revokeDoctor(stranger.address)
        ).to.be.revertedWith("Address is not a verified doctor");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // E. PHARMACY REGISTRATION — requestPharmacyRegistration()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("E. Pharmacy Registration — requestPharmacyRegistration()", function () {

    describe("E1. Happy Path", function () {

      it("should allow any public wallet to submit a pharmacy registration request", async function () {
        await expect(
          contract.connect(pharmacy1)
            .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc")
        ).to.not.be.reverted;
      });

      it("should store the request with correct name, licenseNumber, and requester address", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        const request = await contract.pharmacyRequests(0);
        expect(request.requester).to.equal(pharmacy1.address);
        expect(request.name).to.equal("Guardian Pharmacy");
        expect(request.licenseNumber).to.equal("PHR001");
      });

      it("should set request status to Pending after submission", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        const request = await contract.pharmacyRequests(0);
        expect(request.status).to.equal(0); // 0 = Pending
      });

      it("should increment pharmacyRequestCount by 1 after each request", async function () {
        expect(await contract.pharmacyRequestCount()).to.equal(0);
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        expect(await contract.pharmacyRequestCount()).to.equal(1);
        await contract.connect(pharmacy2)
          .requestPharmacyRegistration("Caring Pharmacy", "PHR002", "ipfs://def");
        expect(await contract.pharmacyRequestCount()).to.equal(2);
      });

      it("should emit PharmacyRegistrationRequested event with correct requestId, requester, and licenseNumber", async function () {
        await expect(
          contract.connect(pharmacy1)
            .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc")
        )
          .to.emit(contract, "PharmacyRegistrationRequested")
          .withArgs(0, pharmacy1.address, "PHR001");
      });

    });

    describe("E2. Revert Conditions", function () {

      it("should revert with 'Name cannot be empty' when name is an empty string", async function () {
        await expect(
          contract.connect(pharmacy1)
            .requestPharmacyRegistration("", "PHR001", "ipfs://abc")
        ).to.be.revertedWith("Name cannot be empty");
      });

      it("should revert with 'License number cannot be empty' when licenseNumber is an empty string", async function () {
        await expect(
          contract.connect(pharmacy1)
            .requestPharmacyRegistration("Guardian Pharmacy", "", "ipfs://abc")
        ).to.be.revertedWith("License number cannot be empty");
      });

      it("should revert when an already-verified pharmacy tries to register again", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(pharmacy1)
            .requestPharmacyRegistration("Guardian Pharmacy", "PHR999", "ipfs://abc")
        ).to.be.revertedWith("Already a verified pharmacy");
      });

      it("should revert when license number is already registered by another pharmacy", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).approvePharmacy(0);
        await expect(
          contract.connect(pharmacy2)
            .requestPharmacyRegistration("Caring Pharmacy", "PHR001", "ipfs://def")
        ).to.be.revertedWith("License number already registered");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // F. PHARMACY APPROVAL — approvePharmacy()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("F. Pharmacy Approval — approvePharmacy()", function () {

    describe("F1. Happy Path", function () {

      it("should allow admin to approve a pending pharmacy request", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(contract.connect(admin).approvePharmacy(0)).to.not.be.reverted;
      });

      it("should grant PHARMACY_ROLE to the approved pharmacy wallet", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).approvePharmacy(0);
        const PHARMACY_ROLE = await contract.PHARMACY_ROLE();
        expect(await contract.hasRole(PHARMACY_ROLE, pharmacy1.address)).to.equal(true);
      });

      it("should set verifiedPharmacies[address] to true after approval", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).approvePharmacy(0);
        expect(await contract.verifiedPharmacies(pharmacy1.address)).to.equal(true);
      });

      it("should update request status from Pending to Approved", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).approvePharmacy(0);
        const request = await contract.pharmacyRequests(0);
        expect(request.status).to.equal(1); // 1 = Approved
      });

      it("should emit PharmacyApproved event with correct requestId and pharmacy address", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(contract.connect(admin).approvePharmacy(0))
          .to.emit(contract, "PharmacyApproved")
          .withArgs(0, pharmacy1.address);
      });

    });

    describe("F2. Access Control", function () {

      it("should revert when a non-admin tries to approve a pharmacy request", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(
          contract.connect(stranger).approvePharmacy(0)
        ).to.be.reverted;
      });

      it("should revert when a doctor tries to approve a pharmacy request", async function () {
        await setupApprovedDoctor1();
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(
          contract.connect(doctor1).approvePharmacy(0)
        ).to.be.reverted;
      });

    });

    describe("F3. Edge Cases", function () {

      it("should revert when approving a pharmacy requestId that does not exist", async function () {
        await expect(
          contract.connect(admin).approvePharmacy(999)
        ).to.be.revertedWith("Request does not exist");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // G. PHARMACY REJECTION — rejectPharmacy()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("G. Pharmacy Rejection — rejectPharmacy()", function () {

    describe("G1. Happy Path", function () {

      it("should allow admin to reject a pending pharmacy request with a reason", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(
          contract.connect(admin).rejectPharmacy(0, "Invalid license")
        ).to.not.be.reverted;
      });

      it("should store the rejection reason in the request struct", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).rejectPharmacy(0, "Invalid license");
        const request = await contract.pharmacyRequests(0);
        expect(request.rejectionReason).to.equal("Invalid license");
      });

      it("should update request status from Pending to Rejected", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).rejectPharmacy(0, "Invalid license");
        const request = await contract.pharmacyRequests(0);
        expect(request.status).to.equal(2); // 2 = Rejected
      });

      it("should emit PharmacyRejected event with correct requestId, requester, and reason", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(
          contract.connect(admin).rejectPharmacy(0, "Invalid license")
        )
          .to.emit(contract, "PharmacyRejected")
          .withArgs(0, pharmacy1.address, "Invalid license");
      });

    });

    describe("G2. Access Control", function () {

      it("should revert when a non-admin tries to reject a pharmacy request", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await expect(
          contract.connect(stranger).rejectPharmacy(0, "reason")
        ).to.be.reverted;
      });

    });

    describe("G3. Edge Cases", function () {

      it("should NOT grant PHARMACY_ROLE to a rejected pharmacy wallet", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian Pharmacy", "PHR001", "ipfs://abc");
        await contract.connect(admin).rejectPharmacy(0, "Invalid license");
        const PHARMACY_ROLE = await contract.PHARMACY_ROLE();
        expect(await contract.hasRole(PHARMACY_ROLE, pharmacy1.address)).to.equal(false);
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // H. PHARMACY REVOCATION — revokePharmacy()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("H. Pharmacy Revocation — revokePharmacy()", function () {

    describe("H1. Happy Path", function () {

      it("should allow admin to revoke a previously approved pharmacy", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(admin).revokePharmacy(pharmacy1.address)
        ).to.not.be.reverted;
      });

      it("should set verifiedPharmacies[address] to false after revocation", async function () {
        await setupApprovedPharmacy1();
        await contract.connect(admin).revokePharmacy(pharmacy1.address);
        expect(await contract.verifiedPharmacies(pharmacy1.address)).to.equal(false);
      });

      it("should revoke PHARMACY_ROLE from the pharmacy wallet", async function () {
        await setupApprovedPharmacy1();
        await contract.connect(admin).revokePharmacy(pharmacy1.address);
        const PHARMACY_ROLE = await contract.PHARMACY_ROLE();
        expect(await contract.hasRole(PHARMACY_ROLE, pharmacy1.address)).to.equal(false);
      });

      it("should emit PharmacyRevoked event with correct pharmacy address", async function () {
        await setupApprovedPharmacy1();
        await expect(contract.connect(admin).revokePharmacy(pharmacy1.address))
          .to.emit(contract, "PharmacyRevoked")
          .withArgs(pharmacy1.address);
      });

    });

    describe("H2. Access Control", function () {

      it("should revert when a non-admin tries to revoke a pharmacy", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(stranger).revokePharmacy(pharmacy1.address)
        ).to.be.reverted;
      });

    });

    describe("H3. Post-Revocation Behaviour", function () {

      it("should prevent a revoked pharmacy from dispensing prescriptions", async function () {
        await setupIssuedPrescription();
        await contract.connect(admin).revokePharmacy(pharmacy1.address);
        await expect(
          contract.connect(pharmacy1).dispensePrescription(0)
        ).to.be.reverted;
      });

      it("should revert when trying to revoke a wallet that was never a pharmacy", async function () {
        await expect(
          contract.connect(admin).revokePharmacy(stranger.address)
        ).to.be.revertedWith("Address is not a verified pharmacy");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // I. PRESCRIPTION ISSUANCE — issuePrescription()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("I. Prescription Issuance — issuePrescription()", function () {

    describe("I1. Happy Path", function () {

      it("should allow an approved doctor to issue a prescription", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.not.be.reverted;
      });

      it("should store prescription with correct doctor address, patient address, dataHash, and ipfsCID", async function () {
        await setupApprovedDoctor1();
        const expiry = validExpiry();
        const dataHash = ethers.encodeBytes32String("rxhash");
        await contract.connect(doctor1).issuePrescription(
          patient1.address, dataHash, "ipfs://rx001", expiry
        );
        const rx = await contract.getPrescription(0);
        expect(rx.doctor).to.equal(doctor1.address);
        expect(rx.patient).to.equal(patient1.address);
        expect(rx.dataHash).to.equal(dataHash);
        expect(rx.ipfsCID).to.equal("ipfs://rx001");
      });

      it("should store prescription with dispensed=false and revoked=false by default", async function () {
        await setupApprovedDoctor1();
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash"),
          "ipfs://rx001",
          validExpiry()
        );
        const rx = await contract.getPrescription(0);
        expect(rx.dispensed).to.equal(false);
        expect(rx.revoked).to.equal(false);
      });

      it("should store the correct expiryTimestamp", async function () {
        await setupApprovedDoctor1();
        const expiry = validExpiry();
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash"),
          "ipfs://rx001",
          expiry
        );
        const rx = await contract.getPrescription(0);
        expect(rx.expiryTimestamp).to.equal(expiry);
      });

      it("should increment prescriptionCount by 1 after each issuance", async function () {
        await setupApprovedDoctor1();
        expect(await contract.prescriptionCount()).to.equal(0);
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash1"),
          "ipfs://rx001",
          validExpiry()
        );
        expect(await contract.prescriptionCount()).to.equal(1);
      });

      it("should emit PrescriptionIssued event with correct prescriptionId, doctor, patient, and expiry", async function () {
        await setupApprovedDoctor1();
        const expiry = validExpiry();
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            expiry
          )
        )
          .to.emit(contract, "PrescriptionIssued")
          .withArgs(0, doctor1.address, patient1.address, expiry);
      });

      it("should allow same doctor to issue multiple prescriptions to different patients", async function () {
        await setupApprovedDoctor1();
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash1"),
          "ipfs://rx001",
          validExpiry()
        );
        await contract.connect(doctor1).issuePrescription(
          patient2.address,
          ethers.encodeBytes32String("rxhash2"),
          "ipfs://rx002",
          validExpiry()
        );
        expect(await contract.prescriptionCount()).to.equal(2);
      });

    });

    describe("I2. Access Control", function () {

      it("should revert when a stranger (no role) tries to issue a prescription", async function () {
        await expect(
          contract.connect(stranger).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.reverted;
      });

      it("should revert when a pharmacy wallet tries to issue a prescription", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(pharmacy1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.reverted;
      });

      it("should revert when a patient wallet tries to issue a prescription", async function () {
        await expect(
          contract.connect(patient1).issuePrescription(
            patient2.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.reverted;
      });

      it("should revert when a revoked doctor tries to issue a prescription", async function () {
        await setupApprovedDoctor1();
        await contract.connect(admin).revokeDoctor(doctor1.address);
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.reverted;
      });

    });

    describe("I3. Edge Cases", function () {

      it("should revert when expiry exceeds MAX_PRESCRIPTION_VALIDITY (30 days)", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            over30DaysExpiry()
          )
        ).to.be.revertedWith("Expiry exceeds maximum validity of 30 days");
      });

      it("should revert when expiry timestamp is in the past", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            pastExpiry()
          )
        ).to.be.revertedWith("Expiry must be in the future");
      });

      it("should revert when patient address is zero address", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).issuePrescription(
            ethers.ZeroAddress,
            ethers.encodeBytes32String("rxhash"),
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.revertedWith("Invalid patient address");
      });

      it("should revert when dataHash is empty (zero bytes32)", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.ZeroHash, 
            "ipfs://rx001",
            validExpiry()
          )
        ).to.be.revertedWith("Data hash cannot be empty");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // J. GET PRESCRIPTION — getPrescription()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("J. Get Prescription — getPrescription()", function () {

    describe("J1. Happy Path", function () {

      it("should return correct prescription details for a valid prescriptionId", async function () {
        await setupIssuedPrescription();
        const rx = await contract.getPrescription(0);
        expect(rx.doctor).to.equal(doctor1.address);
        expect(rx.patient).to.equal(patient1.address);
        expect(rx.dispensed).to.equal(false);
        expect(rx.revoked).to.equal(false);
      });

      it("should be callable by any wallet — it is a public read function", async function () {
        await setupIssuedPrescription();
        await expect(contract.connect(stranger).getPrescription(0)).to.not.be.reverted;
      });

      it("should return dispensed=true after the prescription has been dispensed", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        const rx = await contract.getPrescription(0);
        expect(rx.dispensed).to.equal(true);
      });

      it("should return revoked=true after the prescription has been revoked", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        const rx = await contract.getPrescription(0);
        expect(rx.revoked).to.equal(true);
      });

    });

    describe("J2. Edge Cases", function () {

      it("should revert when prescriptionId does not exist", async function () {
        await expect(
          contract.getPrescription(999)
        ).to.be.revertedWith("Prescription does not exist");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // K. VERIFY PRESCRIPTION — verifyPrescription()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("K. Verify Prescription — verifyPrescription()", function () {

    describe("K1. Happy Path", function () {

      it("should return valid=true for a fresh, unspent, non-expired prescription", async function () {
        await setupIssuedPrescription();
        const result = await contract.connect(pharmacy1).verifyPrescription(0);
        expect(result.valid).to.equal(true);
        expect(result.reason).to.equal("Prescription is valid");
      });

      it("should only be callable by an approved pharmacy wallet", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(pharmacy1).verifyPrescription(0)
        ).to.not.be.reverted;
      });

    });

    describe("K2. Verification Failure Cases", function () {

      it("should return valid=false for an already-dispensed prescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        const result = await contract.connect(pharmacy1).verifyPrescription(0);
        expect(result.valid).to.equal(false);
        expect(result.reason).to.equal("Prescription has already been dispensed");
      });

      it("should return valid=false for a revoked prescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        const result = await contract.connect(pharmacy1).verifyPrescription(0);
        expect(result.valid).to.equal(false);
        expect(result.reason).to.equal("Prescription has been revoked");
      });

      it("should return valid=false for a non-existent prescription", async function () {
        await setupApprovedPharmacy1();
        const result = await contract.connect(pharmacy1).verifyPrescription(999);
        expect(result.valid).to.equal(false);
        expect(result.reason).to.equal("Prescription does not exist");
      });

    });

    describe("K3. Access Control", function () {

      it("should revert when a stranger tries to call verifyPrescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(stranger).verifyPrescription(0)
        ).to.be.reverted;
      });

      it("should revert when a doctor tries to call verifyPrescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(doctor1).verifyPrescription(0)
        ).to.be.reverted;
      });

      it("should revert when a revoked pharmacy tries to call verifyPrescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(admin).revokePharmacy(pharmacy1.address);
        await expect(
          contract.connect(pharmacy1).verifyPrescription(0)
        ).to.be.reverted;
      });

    });

    describe("K4. Edge Cases", function () {

      it("should revert when prescriptionId does not exist", async function () {
        await setupApprovedPharmacy1();
        const result = await contract.connect(pharmacy1).verifyPrescription(999);
        expect(result.valid).to.equal(false);
        expect(result.reason).to.equal("Prescription does not exist");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // L. DISPENSE PRESCRIPTION — dispensePrescription()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("L. Dispense Prescription — dispensePrescription()", function () {

    describe("L1. Happy Path", function () {

      it("should allow an approved pharmacy to dispense a valid prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(pharmacy1).dispensePrescription(0)
        ).to.not.be.reverted;
      });

      it("should set dispensed=true on the prescription after dispensing", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        const rx = await contract.getPrescription(0);
        expect(rx.dispensed).to.equal(true);
      });

      it("should record dispensedBy as the pharmacy wallet address", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        const rx = await contract.getPrescription(0);
        expect(rx.dispensedBy).to.equal(pharmacy1.address);
      });

      it("should emit PrescriptionDispensed event with correct prescriptionId, pharmacy, and timestamp", async function () {
        await setupIssuedPrescription();
        await expect(contract.connect(pharmacy1).dispensePrescription(0))
          .to.emit(contract, "PrescriptionDispensed");
      });

    });

    describe("L2. Revert Conditions", function () {

      it("should revert with 'Already dispensed' on second dispense attempt — prevents double dispensing", async function () {
        await setupIssuedPrescription();
        await setupApprovedPharmacy2();
        await contract.connect(pharmacy1).dispensePrescription(0);
        await expect(
          contract.connect(pharmacy2).dispensePrescription(0)
        ).to.be.revertedWith("Prescription has already been dispensed");
      });

      it("should revert with 'Prescription has been revoked' when dispensing a revoked prescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        await expect(
          contract.connect(pharmacy1).dispensePrescription(0)
        ).to.be.revertedWith("Prescription has been revoked");
      });

      it("should revert with 'Prescription does not exist' for a non-existent prescriptionId", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(pharmacy1).dispensePrescription(999)
        ).to.be.revertedWith("Prescription does not exist");
      });

    });

    describe("L3. Access Control", function () {

      it("should revert when a stranger tries to dispense a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(stranger).dispensePrescription(0)
        ).to.be.reverted;
      });

      it("should revert when a doctor tries to dispense a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(doctor1).dispensePrescription(0)
        ).to.be.reverted;
      });

      it("should revert when a patient tries to dispense a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(patient1).dispensePrescription(0)
        ).to.be.reverted;
      });

      it("should revert when a revoked pharmacy tries to dispense", async function () {
        await setupIssuedPrescription();
        await contract.connect(admin).revokePharmacy(pharmacy1.address);
        await expect(
          contract.connect(pharmacy1).dispensePrescription(0)
        ).to.be.reverted;
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // M. REVOKE PRESCRIPTION — revokePrescription()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("M. Revoke Prescription — revokePrescription()", function () {

    describe("M1. Happy Path", function () {

      it("should allow the issuing doctor to revoke their own prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(doctor1).revokePrescription(0)
        ).to.not.be.reverted;
      });

      it("should allow admin to revoke any prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(admin).revokePrescription(0)
        ).to.not.be.reverted;
      });

      it("should set revoked=true on the prescription after revocation", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        const rx = await contract.getPrescription(0);
        expect(rx.revoked).to.equal(true);
      });

      it("should emit PrescriptionRevoked event with correct prescriptionId and revokedBy address", async function () {
        await setupIssuedPrescription();
        await expect(contract.connect(doctor1).revokePrescription(0))
          .to.emit(contract, "PrescriptionRevoked")
          .withArgs(0, doctor1.address);
      });

    });

    describe("M2. Access Control", function () {

      it("should revert when a pharmacy tries to revoke a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(pharmacy1).revokePrescription(0)
        ).to.be.revertedWith("Only the issuing doctor or admin can revoke");
      });

      it("should revert when a patient tries to revoke a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(patient1).revokePrescription(0)
        ).to.be.revertedWith("Only the issuing doctor or admin can revoke");
      });

      it("should revert when a stranger tries to revoke a prescription", async function () {
        await setupIssuedPrescription();
        await expect(
          contract.connect(stranger).revokePrescription(0)
        ).to.be.revertedWith("Only the issuing doctor or admin can revoke");
      });

      it("should revert when doctor2 tries to revoke a prescription issued by doctor1", async function () {
        await setupIssuedPrescription();
        await setupApprovedDoctor2();
        await expect(
          contract.connect(doctor2).revokePrescription(0)
        ).to.be.revertedWith("Only the issuing doctor or admin can revoke");
      });

    });

    describe("M3. Edge Cases", function () {

      it("should revert when trying to revoke an already-dispensed prescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        await expect(
          contract.connect(doctor1).revokePrescription(0)
        ).to.be.revertedWith("Cannot revoke an already dispensed prescription");
      });

      it("should revert when trying to revoke an already-revoked prescription", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        await expect(
          contract.connect(doctor1).revokePrescription(0)
        ).to.be.revertedWith("Prescription is already revoked");
      });

      it("should prevent dispensing after revocation", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        await expect(
          contract.connect(pharmacy1).dispensePrescription(0)
        ).to.be.revertedWith("Prescription has been revoked");
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // N. GET PENDING DOCTOR REQUESTS — getPendingDoctorRequests()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("N. Get Pending Doctor Requests — getPendingDoctorRequests()", function () {

    describe("N1. Happy Path", function () {

      it("should return all pending doctor requests when called by admin", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(doctor2)
          .requestDoctorRegistration("Dr. Priya", "MMC67890", "ipfs://def");
        const pending = await contract.connect(admin).getPendingDoctorRequests();
        expect(pending.length).to.equal(2);
      });

      it("should return empty array when no doctor requests exist", async function () {
        const pending = await contract.connect(admin).getPendingDoctorRequests();
        expect(pending.length).to.equal(0);
      });

      it("should not include already-approved or rejected requests in pending list", async function () {
        await contract.connect(doctor1)
          .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
        await contract.connect(doctor2)
          .requestDoctorRegistration("Dr. Priya", "MMC67890", "ipfs://def");
        await contract.connect(admin).approveDoctor(0);
        await contract.connect(admin).rejectDoctor(1, "Invalid license");
        const pending = await contract.connect(admin).getPendingDoctorRequests();
        expect(pending.length).to.equal(0);
      });

    });

    describe("N2. Access Control", function () {

      it("should revert when a non-admin tries to call getPendingDoctorRequests", async function () {
        await expect(
          contract.connect(stranger).getPendingDoctorRequests()
        ).to.be.reverted;
      });

      it("should revert when a doctor tries to call getPendingDoctorRequests", async function () {
        await setupApprovedDoctor1();
        await expect(
          contract.connect(doctor1).getPendingDoctorRequests()
        ).to.be.reverted;
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // O. GET PENDING PHARMACY REQUESTS — getPendingPharmacyRequests()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("O. Get Pending Pharmacy Requests — getPendingPharmacyRequests()", function () {

    describe("O1. Happy Path", function () {

      it("should return all pending pharmacy requests when called by admin", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://abc");
        await contract.connect(pharmacy2)
          .requestPharmacyRegistration("Caring", "PHR002", "ipfs://def");
        const pending = await contract.connect(admin).getPendingPharmacyRequests();
        expect(pending.length).to.equal(2);
      });

      it("should return empty array when no pharmacy requests exist", async function () {
        const pending = await contract.connect(admin).getPendingPharmacyRequests();
        expect(pending.length).to.equal(0);
      });

      it("should not include already-approved or rejected requests in pending list", async function () {
        await contract.connect(pharmacy1)
          .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://abc");
        await contract.connect(admin).approvePharmacy(0);
        const pending = await contract.connect(admin).getPendingPharmacyRequests();
        expect(pending.length).to.equal(0);
      });

    });

    describe("O2. Access Control", function () {

      it("should revert when a non-admin tries to call getPendingPharmacyRequests", async function () {
        await expect(
          contract.connect(stranger).getPendingPharmacyRequests()
        ).to.be.reverted;
      });

      it("should revert when a pharmacy tries to call getPendingPharmacyRequests", async function () {
        await setupApprovedPharmacy1();
        await expect(
          contract.connect(pharmacy1).getPendingPharmacyRequests()
        ).to.be.reverted;
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // P. GET MY PRESCRIPTIONS — getMyPrescriptions()
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("P. Get My Prescriptions — getMyPrescriptions()", function () {

    describe("P1. Happy Path", function () {

      it("should return all prescriptions issued to the connected patient wallet", async function () {
        await setupApprovedDoctor1();
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash1"),
          "ipfs://rx001",
          validExpiry()
        );
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash2"),
          "ipfs://rx002",
          validExpiry()
        );
        const myRx = await contract.connect(patient1).getMyPrescriptions();
        expect(myRx.length).to.equal(2);
      });

      it("should return empty array when patient has no prescriptions", async function () {
        const myRx = await contract.connect(patient1).getMyPrescriptions();
        expect(myRx.length).to.equal(0);
      });

      it("should be callable by any connected wallet — no role required", async function () {
        await expect(
          contract.connect(stranger).getMyPrescriptions()
        ).to.not.be.reverted;
      });

      it("should return updated list showing dispensed=true after prescription is dispensed", async function () {
        await setupIssuedPrescription();
        await contract.connect(pharmacy1).dispensePrescription(0);
        const myRx = await contract.connect(patient1).getMyPrescriptions();
        expect(myRx[0].dispensed).to.equal(true);
      });

      it("should return updated list showing revoked=true after prescription is revoked", async function () {
        await setupIssuedPrescription();
        await contract.connect(doctor1).revokePrescription(0);
        const myRx = await contract.connect(patient1).getMyPrescriptions();
        expect(myRx[0].revoked).to.equal(true);
      });

    });

    describe("P2. Edge Cases", function () {

      it("should NOT return prescriptions belonging to other patients", async function () {
        await setupApprovedDoctor1();
        await contract.connect(doctor1).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash1"),
          "ipfs://rx001",
          validExpiry()
        );
        await contract.connect(doctor1).issuePrescription(
          patient2.address,
          ethers.encodeBytes32String("rxhash2"),
          "ipfs://rx002",
          validExpiry()
        );
        const patient1Rx = await contract.connect(patient1).getMyPrescriptions();
        expect(patient1Rx.length).to.equal(1);
        expect(patient1Rx[0].patient).to.equal(patient1.address);
      });

      it("should return multiple prescriptions when patient has more than one", async function () {
        await setupApprovedDoctor1();
        for (let i = 0; i < 3; i++) {
          await contract.connect(doctor1).issuePrescription(
            patient1.address,
            ethers.encodeBytes32String(`rxhash${i}`),
            `ipfs://rx00${i}`,
            validExpiry()
          );
        }
        const myRx = await contract.connect(patient1).getMyPrescriptions();
        expect(myRx.length).to.equal(3);
      });

    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Q. INTEGRATION SCENARIOS — Full Lifecycle (Multi-Account)
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("Q. Integration Scenarios — Full Lifecycle (Multi-Account)", function () {

    it("FULL HAPPY PATH: register doctor → admin approves → issue Rx → pharmacy verifies → dispenses → confirmed", async function () {
      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://doc");
      await contract.connect(admin).approveDoctor(0);

      await contract.connect(pharmacy1)
        .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://phar");
      await contract.connect(admin).approvePharmacy(0);

      const expiry = validExpiry();
      await contract.connect(doctor1).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash"),
        "ipfs://rx001",
        expiry
      );

      const verifyResult = await contract.connect(pharmacy1).verifyPrescription(0);
      expect(verifyResult.valid).to.equal(true);

      await contract.connect(pharmacy1).dispensePrescription(0);

      const rx = await contract.getPrescription(0);
      expect(rx.dispensed).to.equal(true);
      expect(rx.dispensedBy).to.equal(pharmacy1.address);
    });

    it("DOUBLE DISPENSING PREVENTION: pharmacy1 dispenses Rx → pharmacy2 attempts same Rx → must revert", async function () {
      await setupIssuedPrescription();
      await setupApprovedPharmacy2();

      await contract.connect(pharmacy1).dispensePrescription(0);

      await expect(
        contract.connect(pharmacy2).dispensePrescription(0)
      ).to.be.revertedWith("Prescription has already been dispensed");
    });

    it("DOCTOR SHOPPING DETECTION: doctor1 and doctor2 both issue separate Rx to patient1 → both tracked on-chain", async function () {
      await setupApprovedDoctor1();
      await setupApprovedDoctor2();

      await contract.connect(doctor1).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash1"),
        "ipfs://rx001",
        validExpiry()
      );
      await contract.connect(doctor2).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash2"),
        "ipfs://rx002",
        validExpiry()
      );

      const myRx = await contract.connect(patient1).getMyPrescriptions();
      expect(myRx.length).to.equal(2);
      expect(await contract.prescriptionCount()).to.equal(2);
    });

    it("REVOKED DOCTOR FLOW: doctor issues Rx → admin revokes doctor → revoked doctor cannot issue new Rx", async function () {
      await setupApprovedDoctor1();

      await contract.connect(doctor1).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash"),
        "ipfs://rx001",
        validExpiry()
      );

      await contract.connect(admin).revokeDoctor(doctor1.address);

      await expect(
        contract.connect(doctor1).issuePrescription(
          patient2.address,
          ethers.encodeBytes32String("rxhash2"),
          "ipfs://rx002",
          validExpiry()
        )
      ).to.be.reverted;
    });

    it("REVOKED PHARMACY FLOW: pharmacy approved → admin revokes → revoked pharmacy cannot dispense", async function () {
      await setupIssuedPrescription();
      await contract.connect(admin).revokePharmacy(pharmacy1.address);

      await expect(
        contract.connect(pharmacy1).dispensePrescription(0)
      ).to.be.reverted;
    });

    it("STRANGER BLOCKED EVERYWHERE: stranger calls every restricted function → all must revert", async function () {
      await setupIssuedPrescription();

      await expect(contract.connect(stranger).approveDoctor(0)).to.be.reverted;
      await expect(contract.connect(stranger).rejectDoctor(0, "reason")).to.be.reverted;
      await expect(contract.connect(stranger).revokeDoctor(doctor1.address)).to.be.reverted;
      await expect(contract.connect(stranger).approvePharmacy(0)).to.be.reverted;
      await expect(contract.connect(stranger).rejectPharmacy(0, "reason")).to.be.reverted;
      await expect(contract.connect(stranger).revokePharmacy(pharmacy1.address)).to.be.reverted;
      await expect(
        contract.connect(stranger).issuePrescription(
          patient1.address,
          ethers.encodeBytes32String("rxhash"),
          "ipfs://rx",
          validExpiry()
        )
      ).to.be.reverted;
      await expect(contract.connect(stranger).dispensePrescription(0)).to.be.reverted;
      await expect(contract.connect(stranger).verifyPrescription(0)).to.be.reverted;
      await expect(
        contract.connect(stranger).revokePrescription(0)
      ).to.be.revertedWith("Only the issuing doctor or admin can revoke");
      await expect(contract.connect(stranger).getPendingDoctorRequests()).to.be.reverted;
      await expect(contract.connect(stranger).getPendingPharmacyRequests()).to.be.reverted;
    });

    it("FULL REJECTION FLOW: doctor submits → admin rejects → doctor re-submits → admin approves", async function () {
      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
      await contract.connect(admin).rejectDoctor(0, "Invalid MMC number");

      const rejected = await contract.doctorRequests(0);
      expect(rejected.status).to.equal(2);

      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC99999", "ipfs://abc2");
      await contract.connect(admin).approveDoctor(1);

      expect(await contract.verifiedDoctors(doctor1.address)).to.equal(true);
    });

    it("MULTI-PATIENT FLOW: doctor issues Rx to patient1 and patient2 → pharmacy dispenses patient1 Rx → patient2 Rx still active", async function () {
      await setupApprovedDoctor1();
      await setupApprovedPharmacy1();

      await contract.connect(doctor1).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash1"),
        "ipfs://rx001",
        validExpiry()
      );
      await contract.connect(doctor1).issuePrescription(
        patient2.address,
        ethers.encodeBytes32String("rxhash2"),
        "ipfs://rx002",
        validExpiry()
      );

      await contract.connect(pharmacy1).dispensePrescription(0);

      const rx0 = await contract.getPrescription(0);
      expect(rx0.dispensed).to.equal(true);

      const rx1 = await contract.getPrescription(1);
      expect(rx1.dispensed).to.equal(false);
    });

    it("PRESCRIPTION REVOCATION FLOW: doctor issues Rx → doctor revokes → pharmacy attempt must revert", async function () {
      await setupIssuedPrescription();
      await contract.connect(doctor1).revokePrescription(0);

      await expect(
        contract.connect(pharmacy1).dispensePrescription(0)
      ).to.be.revertedWith("Prescription has been revoked");
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // R. GAS BENCHMARKS — All State-Changing Functions
  // ═══════════════════════════════════════════════════════════════════════════════
  describe("R. Gas Benchmarks — All State-Changing Functions", function () {

    it("GAS: requestDoctorRegistration() — recorded by gas-reporter", async function () {
      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
      expect(await contract.doctorRequestCount()).to.equal(1);
    });

    it("GAS: approveDoctor() — recorded by gas-reporter", async function () {
      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
      await contract.connect(admin).approveDoctor(0);
      expect(await contract.verifiedDoctors(doctor1.address)).to.equal(true);
    });

    it("GAS: rejectDoctor() — recorded by gas-reporter", async function () {
      await contract.connect(doctor1)
        .requestDoctorRegistration("Dr. Kumar", "MMC12345", "ipfs://abc");
      await contract.connect(admin).rejectDoctor(0, "Invalid license");
      const req = await contract.doctorRequests(0);
      expect(req.status).to.equal(2);
    });

    it("GAS: revokeDoctor() — recorded by gas-reporter", async function () {
      await setupApprovedDoctor1();
      await contract.connect(admin).revokeDoctor(doctor1.address);
      expect(await contract.verifiedDoctors(doctor1.address)).to.equal(false);
    });

    it("GAS: requestPharmacyRegistration() — recorded by gas-reporter", async function () {
      await contract.connect(pharmacy1)
        .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://abc");
      expect(await contract.pharmacyRequestCount()).to.equal(1);
    });

    it("GAS: approvePharmacy() — recorded by gas-reporter", async function () {
      await contract.connect(pharmacy1)
        .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://abc");
      await contract.connect(admin).approvePharmacy(0);
      expect(await contract.verifiedPharmacies(pharmacy1.address)).to.equal(true);
    });

    it("GAS: rejectPharmacy() — recorded by gas-reporter", async function () {
      await contract.connect(pharmacy1)
        .requestPharmacyRegistration("Guardian", "PHR001", "ipfs://abc");
      await contract.connect(admin).rejectPharmacy(0, "Invalid license");
      const req = await contract.pharmacyRequests(0);
      expect(req.status).to.equal(2);
    });

    it("GAS: revokePharmacy() — recorded by gas-reporter", async function () {
      await setupApprovedPharmacy1();
      await contract.connect(admin).revokePharmacy(pharmacy1.address);
      expect(await contract.verifiedPharmacies(pharmacy1.address)).to.equal(false);
    });

    it("GAS: issuePrescription() — recorded by gas-reporter", async function () {
      await setupApprovedDoctor1();
      await contract.connect(doctor1).issuePrescription(
        patient1.address,
        ethers.encodeBytes32String("rxhash"),
        "ipfs://rx001",
        validExpiry()
      );
      expect(await contract.prescriptionCount()).to.equal(1);
    });

    it("GAS: dispensePrescription() — recorded by gas-reporter", async function () {
      await setupIssuedPrescription();
      await contract.connect(pharmacy1).dispensePrescription(0);
      const rx = await contract.getPrescription(0);
      expect(rx.dispensed).to.equal(true);
    });

    it("GAS: revokePrescription() — recorded by gas-reporter", async function () {
      await setupIssuedPrescription();
      await contract.connect(doctor1).revokePrescription(0);
      const rx = await contract.getPrescription(0);
      expect(rx.revoked).to.equal(true);
    });

  });

});