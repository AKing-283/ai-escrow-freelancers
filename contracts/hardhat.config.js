require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./src",            
    tests: "../test",            
    cache: "./cache",            
    artifacts: "./artifacts"   
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: { 
<<<<<<< HEAD
      chainId: 31337
    },
    localhost: { 
      url: "http://127.0.0.1:8545", 
      chainId: 31337 
=======
      chainId: 1337
    },
    localhost: { 
      url: "http://127.0.0.1:8545", 
      chainId: 1337 
>>>>>>> 6bb10ed5 (feat: improve job management with better rejection handling and UI updates)
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};