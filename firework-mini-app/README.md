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
- **Deposit Functionality**: Uses World ID MiniKit `pay` command for secure deposits
- **Withdraw Functionality**: Uses World ID MiniKit `sendTransaction` command for vault withdrawals
- **Target Vault**: `0x2457537EE691e74b16D672AbF0FFC322c01557c3`
- **Supported Tokens**: USDC, WLD, USDS
- **Real-time Status**: Payment and transaction status tracking with success/error feedback

### 🎨 Modern UI/UX
- Clean, minimalist design with Firework branding
- Responsive layout with bottom navigation
- Animated portfolio numbers and live rate updates
- World ID verification badges and boost indicators

### 📱 Mobile-First Design
- Optimized for World App browser
- Touch-friendly interface
- Bottom navigation for easy access to Assets and Rewards

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: World ID MiniKit SDK
- **Payments**: World ID MiniKit Pay & SendTransaction commands
- **Blockchain**: LayerZero LZRead for cross-chain data
- **UI Components**: shadcn/ui with custom theming
- **Icons**: Lucide React icons

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- World App for testing authentication and payments
- ngrok for local development with World App

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd firework-mini-app
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```env
   # World ID MiniKit Configuration
   NEXT_PUBLIC_WORLD_APP_ID=your_app_id_here
   
   # LayerZero Configuration (for yield rate reading)
   LAYERZERO_ENDPOINT_ID=your_endpoint_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Expose with ngrok for World App testing**
   ```bash
   ngrok http 3000
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WORLD_APP_ID` | Your World App ID from the Developer Portal | Yes |
| `LAYERZERO_ENDPOINT_ID` | LayerZero endpoint ID for cross-chain reads | No (for yield rates) |

## Usage

### Authentication Flow
1. Users sign in using World App
2. SIWE (Sign-In with Ethereum) verification
3. Secure session management with context

### Deposit Flow
1. User clicks "Deposit" button
2. Enters amount and selects token (USDC/WLD)
3. World ID MiniKit `pay` command executes
4. Payment sent to Firework vault address
5. Real-time status updates and confirmation

### Withdraw Flow
1. User clicks "Withdraw" button
2. Enters amount and selects token (USDC/USDS)
3. World ID MiniKit `sendTransaction` command executes
4. Smart contract withdrawal transaction
5. Real-time status updates and confirmation

### Live Rates
- Real-time yield rates from Aave V3 and Morpho Blue
- Cross-chain data via LayerZero LZRead
- Auto-refresh with manual refresh controls
- Visual indicators for live vs cached data

## API Routes

### Authentication
- `POST /api/nonce` - Generate nonce for SIWE
- `POST /api/complete-siwe` - Complete SIWE verification
- `POST /api/check-auth` - Check authentication status
- `POST /api/logout` - Logout user

### Payments
- `POST /api/initiate-payment` - Generate payment reference ID
- `POST /api/confirm-payment` - Verify payment status
- `POST /api/initiate-withdraw` - Generate withdrawal reference ID
- `POST /api/confirm-withdraw` - Verify withdrawal transaction

## Smart Contracts

### YieldRateReader.sol
- LayerZero LZRead integration for cross-chain yield data
- Supports Aave V3 and Morpho Blue protocols
- Deployed on Arbitrum for efficient cross-chain reads

## Development

### Project Structure
```
firework-mini-app/
├── src/
│   ├── app/
│   │   ├── (main)/          # Main app routes
│   │   ├── api/             # API routes
│   │   └── auth/            # Authentication pages
│   ├── components/          # React components
│   └── hooks/               # Custom React hooks
├── contracts/               # Smart contracts
├── public/                  # Static assets
└── scripts/                 # Deployment scripts
```

### Key Components
- `LiveRatesDisplay.tsx` - Live yield rates with LayerZero integration
- `MiniKitProvider.tsx` - World ID MiniKit context provider
- `YieldRateReader.sol` - Smart contract for cross-chain yield reading

## Testing

### World App Testing
1. Install World App on your device
2. Use ngrok to expose your local development server
3. Test authentication and payment flows
4. Verify transaction status and confirmations

### Browser Testing
- Authentication fallback for non-World App browsers
- Mock payment responses for development
- UI/UX testing across different screen sizes

## Deployment

### Production Setup
1. Configure environment variables for production
2. Deploy smart contracts to target networks
3. Update LayerZero configuration
4. Deploy Next.js application

### Smart Contract Deployment
```bash
# Deploy YieldRateReader contract
npx hardhat run scripts/deploy-yield-reader.ts --network arbitrum
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with World App
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the [World Developer Docs](https://docs.world.org)
- Review the [LayerZero Documentation](https://layerzero.network/docs)
- Open an issue in this repository
