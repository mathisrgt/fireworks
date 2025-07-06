# Firework Mini App

A Next.js 15 application with World ID authentication, cross-chain yield rate monitoring, and secure payment processing using LayerZero LZRead.

## Features

### 🔐 World ID Authentication
- Seamless sign-in using World App
- SIWE (Sign-In with Ethereum) integration
- Secure authentication flow with nonce verification

### 💰 Cross-Chain Yield Rate Monitoring
- **Live Rates Section**: Real-time yield rates from major DeFi protocols
- **LayerZero LZRead Integration**: Cross-chain data fetching from Ethereum mainnet
- **Supported Protocols**:
  - **Aave V3**: USDC supply rates
  - **Morpho Blue**: USDC market data and utilization rates
- **Smart Contract**: `YieldRateReader.sol` deployed on Arbitrum for efficient cross-chain reads

### 💳 Secure Payment Processing
- **Deposit Functionality**: Direct USDC/WLD deposits to Firework vault
- **World ID MiniKit Integration**: Secure payment processing via World App
- **Real-Time Verification**: Payment status tracking and confirmation
- **Vault Address**: `0x2457537EE691e74b16D672AbF0FFC322c01557c3`

### 🎨 Modern UI/UX
- Clean, minimalist design with Firework branding
- Responsive layout with bottom navigation
- Animated portfolio overview with real-time number updates
- Protocol logos and live status indicators

### 📱 Mobile-First Design
- Optimized for World App browser
- Touch-friendly interface
- Bottom navigation for easy access to Assets and Rewards

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Authentication**: World ID MiniKit SDK
- **Payments**: World ID MiniKit sendPayment command
- **Blockchain**: LayerZero LZRead, Ethers.js, Viem
- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Deployment**: Arbitrum network

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- World App for testing authentication and payments

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd firework-mini-app
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```bash
# World ID MiniKit Configuration
# Get these from https://developer.worldcoin.org/
APP_ID=your_app_id_here
DEV_PORTAL_API_KEY=your_dev_portal_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Payment Integration

### Deposit Flow
1. User clicks "Deposit" button
2. Modal opens with amount and token selection
3. User enters amount and selects token (USDC/WLD)
4. Payment is initiated via World ID MiniKit
5. World App opens for payment confirmation
6. Payment is processed on-chain
7. Backend verifies payment status
8. Success confirmation is displayed

### Supported Tokens
- **USDC**: Stablecoin deposits with 5.10% APY
- **WLD**: Worldcoin token deposits with 3.12% APY

### Security Features
- Payment reference tracking
- Backend verification via World Developer Portal API
- Transaction status monitoring
- Error handling and user feedback

## Project Structure

```
firework-mini-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   │   ├── initiate-payment/  # Payment initiation
│   │   │   └── confirm-payment/   # Payment verification
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── contracts/              # Smart contracts
│   └── YieldRateReader.sol # LayerZero yield reader
├── scripts/                # Deployment scripts
└── public/                 # Static assets
```

## Live Rates Integration

The Live Rates section displays real-time yield data from:

1. **Aave V3**: Fetches USDC liquidity rates from PoolDataProvider
2. **Morpho Blue**: Reads market utilization and calculates supply rates
3. **Cross-Chain**: Uses LayerZero LZRead to fetch data from Ethereum mainnet
4. **Real-Time Updates**: Automatic refresh with live status indicators

### Smart Contract Features
- Cross-chain read requests via LayerZero
- Batch data fetching for multiple protocols
- Gas-efficient rate calculations
- Event emission for frontend updates

## Authentication Flow

1. User clicks "Sign in" button
2. World App opens with SIWE message
3. User signs the message in World App
4. Backend verifies signature and nonce
5. User is redirected to Assets page
6. Session is maintained across app

## Deployment

### Smart Contract Deployment
```bash
# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy-yield-reader.ts --network arbitrumSepolia
```

### Frontend Deployment
The app can be deployed to Vercel or any Next.js-compatible platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
