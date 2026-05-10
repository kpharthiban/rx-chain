// Implement deployment script here
// Run with: npx hardhat run scripts/deploy.js --network ganache
// Run with: npx hardhat run scripts/deploy.js --network sepolia

async function main() {
  console.log("Deploying PrescriptionRegistry...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});