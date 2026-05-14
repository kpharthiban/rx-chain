// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
// SECURITY: Integer overflow and underflow protection is automatically enforced
// by the Solidity ^0.8.20 compiler. Arithmetic operations revert on overflow
// rather than wrapping silently, eliminating a whole class of vulnerabilities
// without requiring SafeMath libraries.

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrescriptionRegistry
 * @author Group V — TT5L - CCS6354
 * @notice Blockchain-based medical prescription verification system.
 *         Prevents prescription forgery, double dispensing, and doctor shopping.
 * @dev Roles: DEFAULT_ADMIN_ROLE (KKM/MMC), DOCTOR_ROLE, PHARMACY_ROLE.
 *      Patient wallets require no role — they are scoped read-only by msg.sender.
 */

contract PrescriptionRegistry is AccessControl, Ownable {
    // =========================================================
    // ROLES
    // =========================================================
    // SECURITY: Role-Based Access Control (RBAC) via OpenZeppelin AccessControl.
    // Restricts issuePrescription() to DOCTOR_ROLE, dispensePrescription() and
    // verifyPrescription() to PHARMACY_ROLE, and all admin functions to DEFAULT_ADMIN_ROLE.
    bytes32 public constant DOCTOR_ROLE   = keccak256("DOCTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    // =========================================================
    // ENUMS
    // =========================================================
    /// @dev Tracks the lifecycle state of a doctor or pharmacy registration request.
    enum RequestStatus { Pending, Approved, Rejected }
    
    // =========================================================
    // STRUCTS  
    // =========================================================
    /**
     * @dev Stores a doctor or pharmacy registration request submitted on-chain.
     *      Applicant must ALSO contact the official authority through the official
     *      government channel (MMC for doctors / Pharmaceutical Services Division
     *      for pharmacies). Admin cross-checks both layers before approving.
     */
    struct RegistrationRequest {
        address requester;        // Wallet address of the applicant
        string  name;             // Full name of doctor or pharmacy
        string  licenseNumber;    // MMC no. (doctor) or Type A Poison License no. (pharmacy, e.g. KL0045/2024)
        string  ipfsCID;          // IPFS CID of uploaded supporting document
        RequestStatus status;     // Current state: Pending / Approved / Rejected
        string  rejectionReason;  // Populated only if rejected by admin
        uint256 submittedAt;      // Block timestamp of submission
    }

    /**
     * @dev Stores an on-chain prescription issued by a verified doctor.
     *      Actual prescription data (drug name, dosage, patient name) lives on IPFS —
     *      only the hash and CID are stored here for privacy (PDPA compliance).
     */
    struct Prescription {
        address doctor;           // Wallet of the issuing doctor
        address patient;          // Wallet of the patient
        bytes32 dataHash;         // keccak256 hash of the actual prescription data
        string  ipfsCID;          // IPFS CID pointing to the prescription data
        uint256 expiryTimestamp;  // Unix timestamp after which prescription is invalid
        bool    dispensed;        // True once a pharmacy has dispensed this prescription
        bool    revoked;          // True if doctor or admin cancelled this prescription
        uint256 issuedAt;         // Block timestamp of issuance
        address dispensedBy;      // Pharmacy wallet that dispensed (address(0) if not yet)
    }

    // =========================================================
    // CONSTANTS  
    // =========================================================
    /// @dev Maximum validity period for any prescription — 30 days from issuance.
    uint256 public constant MAX_PRESCRIPTION_VALIDITY = 30 days;

    // =========================================================
    // STATE VARIABLES 
    // =========================================================
    uint256 public doctorRequestCount;    // Total doctor registration requests submitted
    uint256 public pharmacyRequestCount;  // Total pharmacy registration requests submitted
    uint256 public prescriptionCount;     // Total prescriptions ever issued

    // =========================================================
    // MAPPINGS  
    // =========================================================
    // Registration requests
    mapping(uint256 => RegistrationRequest) public doctorRequests;
    mapping(uint256 => RegistrationRequest) public pharmacyRequests;

    // Approved role holders
    mapping(address => bool) public verifiedDoctors;
    mapping(address => bool) public verifiedPharmacies;

    // SECURITY: Prevents the same license number being registered twice
    // Mitigates impersonation — if the real doctor registers first,
    // an impersonator cannot submit a second request with the same license number
    mapping(string => bool) public licenseNumberUsed;

    // Prescriptions
    mapping(uint256 => Prescription) public prescriptions;

    // =========================================================
    // EVENTS
    // =========================================================
    // --- Registration Events ---

    /// @dev Emitted when a doctor submits a registration request on-chain.
    event DoctorRegistrationRequested(
        uint256 indexed requestId,
        address indexed requester,
        string licenseNumber
    );

    /// @dev Emitted when admin approves a doctor registration request.
    event DoctorApproved(
        uint256 indexed requestId,
        address indexed doctor
    );

    /// @dev Emitted when admin rejects a doctor registration request.
    event DoctorRejected(
        uint256 indexed requestId,
        address indexed requester,
        string reason
    );

    /// @dev Emitted when a pharmacy submits a registration request on-chain.
    event PharmacyRegistrationRequested(
        uint256 indexed requestId,
        address indexed requester,
        string licenseNumber
    );

    /// @dev Emitted when admin approves a pharmacy registration request.
    event PharmacyApproved(
        uint256 indexed requestId,
        address indexed pharmacy
    );

    /// @dev Emitted when admin rejects a pharmacy registration request.
    event PharmacyRejected(
        uint256 indexed requestId,
        address indexed requester,
        string reason
    );

    /// @dev Emitted when admin revokes a previously approved doctor.
    event DoctorRevoked(address indexed doctor);

    /// @dev Emitted when admin revokes a previously approved pharmacy.
    event PharmacyRevoked(address indexed pharmacy);

    // --- Prescription Events ---

    /// @dev Emitted when a verified doctor issues a new prescription.
    event PrescriptionIssued(
        uint256 indexed prescriptionId,
        address indexed doctor,
        address indexed patient,
        uint256 expiry
    );

    /// @dev Emitted when a verified pharmacy dispenses a prescription.
    event PrescriptionDispensed(
        uint256 indexed prescriptionId,
        address indexed pharmacy,
        uint256 timestamp
    );

    /// @dev Emitted when a prescription is revoked by the issuing doctor or admin.
    event PrescriptionRevoked(
        uint256 indexed prescriptionId,
        address indexed revokedBy
    );

    // =========================================================
    // CONSTRUCTOR  
    // =========================================================
    // NOTE: ReentrancyGuard is intentionally not used — this contract contains
    // no payable functions and performs no Ether transfers. There is no reentrancy
    // attack surface. CEI pattern is still applied on dispensePrescription() as
    // a best-practice defence against future modifications.
    /**
     * @dev Deploys the contract. The deployer wallet becomes the DEFAULT_ADMIN_ROLE
     *      (representing KKM/MMC) and the Ownable owner.
     *      This wallet is the only one authorised to approve or reject
     *      doctor and pharmacy registration requests.
     */
    
    constructor() Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // =========================================================
    // REGISTRATION FUNCTIONS — DOCTOR
    // =========================================================
    /**
     * @dev Allows a doctor to submit a registration request on-chain.
     *      Applicant must ALSO contact MMC through the official MERITS portal
     *      (merits.mmc.gov.my) — admin cross-checks both before approving.
     * @param _name Full name of the doctor.
     * @param _licenseNumber MMC registration number.
     * @param _ipfsCID IPFS CID of the uploaded supporting document.
     */
    function requestDoctorRegistration(
        string calldata _name,
        string calldata _licenseNumber,
        string calldata _ipfsCID
    ) external {
        // SECURITY: Input validation
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_licenseNumber).length > 0, "License number cannot be empty");
        require(!verifiedDoctors[msg.sender], "Already a verified doctor");
        require(!licenseNumberUsed[_licenseNumber], "License number already registered");

        uint256 requestId = doctorRequestCount;
        doctorRequestCount++;

        doctorRequests[requestId] = RegistrationRequest({
            requester:       msg.sender,
            name:            _name,
            licenseNumber:   _licenseNumber,
            ipfsCID:         _ipfsCID,
            status:          RequestStatus.Pending,
            rejectionReason: "",
            submittedAt:     block.timestamp
        });

        emit DoctorRegistrationRequested(requestId, msg.sender, _licenseNumber);
    }

    /**
     * @dev Admin approves a pending doctor registration request.
     *      Grants DOCTOR_ROLE to the requester's wallet.
     * @param _requestId ID of the doctor registration request to approve.
     */
    function approveDoctor(uint256 _requestId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RegistrationRequest storage request = doctorRequests[_requestId];

        // SECURITY: Input validation
        require(request.requester != address(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");

        request.status = RequestStatus.Approved;
        verifiedDoctors[request.requester] = true;
        licenseNumberUsed[request.licenseNumber] = true;

        _grantRole(DOCTOR_ROLE, request.requester);

        emit DoctorApproved(_requestId, request.requester);
    }

    /**
     * @dev Admin rejects a pending doctor registration request with a reason.
     * @param _requestId ID of the doctor registration request to reject.
     * @param _reason Human-readable reason for rejection.
     */
    function rejectDoctor(
        uint256 _requestId,
        string calldata _reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RegistrationRequest storage request = doctorRequests[_requestId];

        // SECURITY: Input validation
        require(request.requester != address(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");
        require(bytes(_reason).length > 0, "Rejection reason cannot be empty");

        request.status = RequestStatus.Rejected;
        request.rejectionReason = _reason;

        emit DoctorRejected(_requestId, request.requester, _reason);
    }

    /**
     * @dev Admin revokes a previously approved doctor (e.g. misconduct or license expiry).
     *      Revokes DOCTOR_ROLE from the wallet.
     * @param _doctor Wallet address of the doctor to revoke.
     */
    function revokeDoctor(address _doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // SECURITY: Input validation
        require(verifiedDoctors[_doctor], "Address is not a verified doctor");

        verifiedDoctors[_doctor] = false;
        _revokeRole(DOCTOR_ROLE, _doctor);

        emit DoctorRevoked(_doctor);
    }

    // =========================================================
    // REGISTRATION FUNCTIONS — PHARMACY
    // =========================================================
    /**
     * @dev Allows a pharmacy to submit a registration request on-chain.
     *      Applicant must ALSO contact the Pharmaceutical Services Division
     *      through the official government channel — admin cross-checks both before approving.
     * @param _name Name of the pharmacy.
     * @param _licenseNumber Type A Poison License number (e.g. KL0045/2024).
     * @param _ipfsCID IPFS CID of the uploaded license document.
     */
    function requestPharmacyRegistration(
        string calldata _name,
        string calldata _licenseNumber,
        string calldata _ipfsCID
    ) external {
        // SECURITY: Input validation
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_licenseNumber).length > 0, "License number cannot be empty");
        require(!verifiedPharmacies[msg.sender], "Already a verified pharmacy");
        require(!licenseNumberUsed[_licenseNumber], "License number already registered");

        uint256 requestId = pharmacyRequestCount;
        pharmacyRequestCount++;

        pharmacyRequests[requestId] = RegistrationRequest({
            requester:       msg.sender,
            name:            _name,
            licenseNumber:   _licenseNumber,
            ipfsCID:         _ipfsCID,
            status:          RequestStatus.Pending,
            rejectionReason: "",
            submittedAt:     block.timestamp
        });

        emit PharmacyRegistrationRequested(requestId, msg.sender, _licenseNumber);
    }

    /**
     * @dev Admin approves a pending pharmacy registration request.
     *      Grants PHARMACY_ROLE to the requester's wallet.
     * @param _requestId ID of the pharmacy registration request to approve.
     */
    function approvePharmacy(uint256 _requestId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RegistrationRequest storage request = pharmacyRequests[_requestId];

        // SECURITY: Input validation
        require(request.requester != address(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");

        request.status = RequestStatus.Approved;
        verifiedPharmacies[request.requester] = true;
        licenseNumberUsed[request.licenseNumber] = true;

        _grantRole(PHARMACY_ROLE, request.requester);

        emit PharmacyApproved(_requestId, request.requester);
    }

    /**
     * @dev Admin rejects a pending pharmacy registration request with a reason.
     * @param _requestId ID of the pharmacy registration request to reject.
     * @param _reason Human-readable reason for rejection.
     */
    function rejectPharmacy(
        uint256 _requestId,
        string calldata _reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RegistrationRequest storage request = pharmacyRequests[_requestId];

        // SECURITY: Input validation
        require(request.requester != address(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");
        require(bytes(_reason).length > 0, "Rejection reason cannot be empty");

        request.status = RequestStatus.Rejected;
        request.rejectionReason = _reason;

        emit PharmacyRejected(_requestId, request.requester, _reason);
    }

    /**
     * @dev Admin revokes a previously approved pharmacy (e.g. license expired or misconduct).
     *      Revokes PHARMACY_ROLE from the wallet.
     * @param _pharmacy Wallet address of the pharmacy to revoke.
     */
    function revokePharmacy(address _pharmacy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // SECURITY: Input validation
        require(verifiedPharmacies[_pharmacy], "Address is not a verified pharmacy");

        verifiedPharmacies[_pharmacy] = false;
        _revokeRole(PHARMACY_ROLE, _pharmacy);

        emit PharmacyRevoked(_pharmacy);
    }

    // =========================================================
    // PRESCRIPTION FUNCTIONS
    // =========================================================
    /**
     * @dev Issues a new prescription on-chain. Only verified doctors can call this.
     *      Actual prescription data is stored on IPFS — only the hash and CID
     *      are stored on-chain for privacy (PDPA compliance).
     * @param _patient Wallet address of the patient.
     * @param _dataHash keccak256 hash of the prescription data (computed off-chain).
     * @param _ipfsCID IPFS CID pointing to the actual prescription data.
     * @param _expiryTimestamp Unix timestamp after which the prescription is invalid.
     */
    function issuePrescription(
        address _patient,
        bytes32 _dataHash,
        string calldata _ipfsCID,
        uint256 _expiryTimestamp
    ) external onlyRole(DOCTOR_ROLE) {
        // SECURITY: Input validation
        require(_patient != address(0), "Invalid patient address");
        require(_dataHash != bytes32(0), "Data hash cannot be empty");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(
            _expiryTimestamp > block.timestamp,
            "Expiry must be in the future"
        );
        require(
            _expiryTimestamp <= block.timestamp + MAX_PRESCRIPTION_VALIDITY,
            "Expiry exceeds maximum validity of 30 days"
        );

        uint256 prescriptionId = prescriptionCount;
        prescriptionCount++;

        prescriptions[prescriptionId] = Prescription({
            doctor:          msg.sender,
            patient:         _patient,
            dataHash:        _dataHash,
            ipfsCID:         _ipfsCID,
            expiryTimestamp: _expiryTimestamp,
            dispensed:       false,
            revoked:         false,
            issuedAt:        block.timestamp,
            dispensedBy:     address(0)
        });

        emit PrescriptionIssued(prescriptionId, msg.sender, _patient, _expiryTimestamp);
    }

    /**
     * @dev Verifies whether a prescription is valid for dispensing.
     *      Read-only — does not change state. Pharmacy calls this before dispensing.
     * @param _prescriptionId ID of the prescription to verify.
     * @return valid True if prescription can be dispensed.
     * @return reason Human-readable status message.
     */
    function verifyPrescription(
        uint256 _prescriptionId
    ) external view onlyRole(PHARMACY_ROLE) returns (bool valid, string memory reason) {
        Prescription storage p = prescriptions[_prescriptionId];

        if (p.issuedAt == 0)          return (false, "Prescription does not exist");
        if (p.revoked)                 return (false, "Prescription has been revoked");
        if (p.dispensed)               return (false, "Prescription has already been dispensed");
        if (block.timestamp > p.expiryTimestamp) return (false, "Prescription has expired");

        return (true, "Prescription is valid");
    }

    /**
     * @dev Dispenses a prescription. Marks it as dispensed — irreversible.
     *      Only verified pharmacies can call this.
     * @param _prescriptionId ID of the prescription to dispense.
     */
    function dispensePrescription(
        uint256 _prescriptionId
    ) external onlyRole(PHARMACY_ROLE) {
        // SECURITY: Checks-Effects-Interactions (CEI) pattern
        // CHECKS
        Prescription storage p = prescriptions[_prescriptionId];
        require(p.issuedAt != 0, "Prescription does not exist");
        require(!p.revoked, "Prescription has been revoked");
        require(!p.dispensed, "Prescription has already been dispensed");
        require(block.timestamp <= p.expiryTimestamp, "Prescription has expired");

        // EFFECTS — state changes before any external interaction
        p.dispensed = true;
        p.dispensedBy = msg.sender;

        // INTERACTIONS
        emit PrescriptionDispensed(_prescriptionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Revokes a prescription. Can be called by the issuing doctor or admin.
     *      Used when a prescription was issued in error or is no longer valid.
     * @param _prescriptionId ID of the prescription to revoke.
     */
    function revokePrescription(uint256 _prescriptionId) external {
        Prescription storage p = prescriptions[_prescriptionId];

        // SECURITY: Input validation
        require(p.issuedAt != 0, "Prescription does not exist");
        require(!p.dispensed, "Cannot revoke an already dispensed prescription");
        require(!p.revoked, "Prescription is already revoked");
        require(
            p.doctor == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only the issuing doctor or admin can revoke"
        );

        p.revoked = true;

        emit PrescriptionRevoked(_prescriptionId, msg.sender);
    }

    // =========================================================
    // VIEW FUNCTIONS
    // =========================================================
    /**
     * @dev Returns the full details of a prescription by ID.
     *      Public — anyone can read a prescription if they know the ID.
     *      Actual sensitive data lives on IPFS — only hash and CID exposed here.
     * @param _prescriptionId ID of the prescription to retrieve.
     * @return The full Prescription struct.
     */
    function getPrescription(
        uint256 _prescriptionId
    ) external view returns (Prescription memory) {
        require(
            prescriptions[_prescriptionId].issuedAt != 0,
            "Prescription does not exist"
        );
        return prescriptions[_prescriptionId];
    }

    /**
     * @dev Returns all prescriptions issued to the calling wallet address.
     *      Privacy-scoped — patients can only retrieve their own prescriptions.
     * @return An array of Prescription structs belonging to msg.sender.
     */
    function getMyPrescriptions() external view returns (Prescription[] memory) {
        uint256 total = prescriptionCount;
        uint256 count = 0;

        // First pass — count how many belong to caller
        for (uint256 i = 0; i < total; i++) {
            if (prescriptions[i].patient == msg.sender) {
                count++;
            }
        }

        // Second pass — populate result array
        Prescription[] memory result = new Prescription[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (prescriptions[i].patient == msg.sender) {
                result[index] = prescriptions[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Returns all pending doctor registration requests.
     *      Admin only — used to populate the Admin Panel.
     * @return An array of pending RegistrationRequest structs.
     */
    function getPendingDoctorRequests()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (RegistrationRequest[] memory)
    {
        uint256 total = doctorRequestCount;
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            if (doctorRequests[i].status == RequestStatus.Pending) {
                count++;
            }
        }

        RegistrationRequest[] memory result = new RegistrationRequest[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (doctorRequests[i].status == RequestStatus.Pending) {
                result[index] = doctorRequests[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Returns all pending pharmacy registration requests.
     *      Admin only — used to populate the Admin Panel.
     * @return An array of pending RegistrationRequest structs.
     */
    function getPendingPharmacyRequests()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (RegistrationRequest[] memory)
    {
        uint256 total = pharmacyRequestCount;
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            if (pharmacyRequests[i].status == RequestStatus.Pending) {
                count++;
            }
        }

        RegistrationRequest[] memory result = new RegistrationRequest[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (pharmacyRequests[i].status == RequestStatus.Pending) {
                result[index] = pharmacyRequests[i];
                index++;
            }
        }

        return result;
    }    
}