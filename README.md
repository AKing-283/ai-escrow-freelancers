# Will Escrow DApp

A decentralized application for creating time-locked escrow accounts using Ethereum smart contracts.

## Features

- Create time-locked escrow accounts with ETH
- Set beneficiaries and release times
- Automatic fund release after the specified time
- Web3 wallet integration (MetaMask)
- Transaction history tracking
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7+
- MetaMask browser extension
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd will-escrow-dapp
```

2. Install dependencies:
```bash
npm run install:all
```

3. Create a `.env` file in the frontend directory:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
```

## Running the Application

1. Start the local Hardhat node:
```bash
npm run start:hardhat
```

2. In a new terminal, deploy the smart contract:
```bash
npm run deploy:contract
```

3. Start the Flask backend:
```bash
npm run start:backend
```

4. Start the Next.js frontend:
```bash
npm run start:frontend
```

Or run all services concurrently:
```bash
npm run dev
```

## Usage

1. Connect your MetaMask wallet (make sure it's connected to localhost:8545)
2. On the home page:
   - Enter the beneficiary's address
   - Specify the amount of ETH to deposit
   - Set the release time
   - Click "Deposit" to create the escrow
3. On the withdraw page:
   - View available escrows where you are the beneficiary
   - Click "Release Funds" to withdraw after the release time

## Testing

Run the smart contract tests:
```bash
npm run test:contract
```

## Project Structure

```
├── contracts/           # Smart contracts
│   ├── WillEscrow.sol
│   └── scripts/
├── frontend/           # Next.js frontend
│   └── src/
├── backend/           # Flask backend
│   └── app.py
└── test/             # Smart contract tests
```

## License

MIT 