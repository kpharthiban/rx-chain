// Deployment script for PrescriptionRegistry
// Run with: npx hardhat run scripts/deploy.js --network sepolia
// Run with: npx hardhat run scripts/deploy.js --network ganache

const { ethers, run, network } = require("hardhat");

async function main() {

  // ── STEP 1: Show deployer info ───────────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  console.log("===========================================");
  console.log("Deploying PrescriptionRegistry...");
  console.log("===========================================");
  console.log("Network       :", network.name);
  console.log("Deployer      :", deployer.address);
  console.log("Balance       :", ethers.utils.formatEther(
    await deployer.getBalance()
  ), "ETH");
  console.log("===========================================");

  // ── STEP 2: Deploy the contract ─────────────────────────────────────────────
  const Factory = await ethers.getContractFactory("PrescriptionRegistry");
  const contract = await Factory.deploy();
  await contract.deployed();

  console.log("Contract deployed to :", contract.address);
  console.log("Transaction hash     :", contract.deployTransaction.hash);
  console.log("===========================================");

  // ── STEP 3: Wait for block confirmations ────────────────────────────────────
  // Only wait on Sepolia — Ganache confirms instantly
  if (network.name === "sepolia") {
    console.log("Waiting for 5 block confirmations...");
    await contract.deployTransaction.wait(5);
    console.log("5 blocks confirmed!");
    console.log("===========================================");

    // ── STEP 4: Verify on Etherscan (Sepolia only) ───────────────────────────
    console.log("Verifying contract on Sepolia Etherscan...");
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan!");
      console.log("Etherscan URL: https://sepolia.etherscan.io/address/" 
        + contract.address);
    } catch (err) {
      if (err.message.includes("already verified")) {
        console.log("Already verified on Etherscan.");
      } else {
        console.error("Verification failed:", err.message);
      }
    }
    console.log("===========================================");
  }

  // ── STEP 5: Print deployment summary ────────────────────────────────────────
  console.log("\n DEPLOYMENT SUMMARY");
  console.log("===========================================");
  console.log("Contract Name    : PrescriptionRegistry");
  console.log("Network          :", network.name);
  console.log("Contract Address :", contract.address);
  console.log("Deployer Address :", deployer.address);
  console.log("Deployed At      :", new Date().toISOString());
  console.log("===========================================");
  console.log("\n ACTION REQUIRED:");
  console.log("Copy this address into frontend/src/config/contract.js:");
  console.log("CONTRACT_ADDRESS =", `"${contract.address}"`);
  console.log("===========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});