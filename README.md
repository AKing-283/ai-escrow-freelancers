# AI Escrow for Freelancers

A decentralized escrow system for freelancers, built with Next.js, Hardhat, and Solidity.

## Overview

This project allows freelancers and clients to create and manage escrow contracts on the blockchain. It uses a smart contract to hold funds until the work is completed and approved.

## Features

- Create and manage escrow contracts
- Release funds upon completion
- View all escrows
- Connect with MetaMask

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Smart Contract:** Solidity, Hardhat
- **Blockchain:** Ethereum (local Hardhat network, Mumbai testnet)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MetaMask
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aking-283/ai-escrow-freelancers.git
   cd ai-escrow-freelancers
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   ```

3. Set up environment variables:
   - In `contracts/`, create a `.env` file:
     ```
     PRIVATE_KEY=your_wallet_private_key
     MUMBAI_RPC_URL=your_rpc_url
     POLYGONSCAN_API_KEY=your_polygonscan_api_key
     ```

4. Deploy the smart contract:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network mumbai
   ```

5. Update the contract address in `frontend/src/context/Web3Context.tsx`.

6. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Usage

- Open the dApp in your browser (e.g., http://localhost:3000)
- Connect MetaMask (make sure it’s on the Mumbai testnet)
- Create an escrow, view escrows, and release funds

## Deployment

- **Smart Contract:** Deployed on Mumbai testnet
- **Frontend:** Deployed on GitHub Pages

## License

MIT

## Contact

Your Name - [Email here for any queries](mailto:dpreddy294@gmail.com)

Project Link: [https://github.com/aking-283/ai-escrow-freelancers](https://github.com/aking-283/ai-escrow-freelancers)
