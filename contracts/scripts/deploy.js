const hre = require("hardhat");

async function main() {
  console.log("Deploying WillEscrow contract...");
  
  const WillEscrow = await hre.ethers.getContractFactory("WillEscrow");
  const willEscrow = await WillEscrow.deploy();

  await willEscrow.waitForDeployment();
  const address = await willEscrow.getAddress();

  console.log("WillEscrow deployed to:", address);
  console.log("Please update the contract address in frontend/src/context/Web3Context.tsx");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 