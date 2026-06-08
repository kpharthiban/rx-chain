// Deployment script for PrescriptionRegistry
// Run with: npx hardhat run scripts/deploy.js --network sepolia
// Run with: npx hardhat run scripts/deploy.js --network ganache

const { ethers, run, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("===========================================");
  console.log("Deploying PrescriptionRegistry...");
  console.log("===========================================");
  console.log("Network       :", network.name);
  console.log("Deployer      :", deployer.address);
  console.log("Balance       :", ethers.formatEther(balance), "ETH");
  console.log("===========================================");

  const Factory = await ethers.getContractFactory("PrescriptionRegistry");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();

  console.log("Contract deployed to :", contractAddress);
  console.log("Transaction hash     :", deploymentTx.hash);
  console.log("===========================================");

  if (network.name === "sepolia") {
    console.log("Waiting for 5 block confirmations...");
    await deploymentTx.wait(5);
    console.log("5 blocks confirmed!");
    console.log("===========================================");

    console.log("Verifying contract on Sepolia Etherscan...");

    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });

      console.log("Contract verified on Etherscan!");
      console.log(
        "Etherscan URL: https://sepolia.etherscan.io/address/" +
          contractAddress
      );
    } catch (err) {
      if (err.message.includes("already verified")) {
        console.log("Already verified on Etherscan.");
      } else {
        console.error("Verification failed:", err.message);
      }
    }

    console.log("===========================================");
  }

  console.log("\nDEPLOYMENT SUMMARY");
  console.log("===========================================");
  console.log("Contract Name    : PrescriptionRegistry");
  console.log("Network          :", network.name);
  console.log("Contract Address :", contractAddress);
  console.log("Deployer Address :", deployer.address);
  console.log("Deployed At      :", new Date().toISOString());
  console.log("===========================================");
  console.log("\nACTION REQUIRED:");
  console.log("Copy this address into frontend/.env:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("===========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});