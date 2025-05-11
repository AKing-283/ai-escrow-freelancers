const hre = require("hardhat");

async function main() {
  const WillEscrow = await hre.ethers.getContractFactory("WillEscrow");
  const willEscrow = await WillEscrow.deploy();

  await willEscrow.waitForDeployment();

  console.log("WillEscrow deployed to:", await willEscrow.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 