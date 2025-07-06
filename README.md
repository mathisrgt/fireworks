# 🔥 Firework

**Cross-Chain Yield Optimization Protocol**

Firework is a cross-chain yield optimization protocol that allows users to earn the best available APY across multiple chains and lending protocols—all with a single click and no prior DeFi experience required. Users deposit USDC on Worldchain, and Firework seamlessly handles everything else: converting it into lzUSD (a yield-bearing synthetic stablecoin), routing it through the lzUSD Gateway, and allocating it to the most profitable lending opportunities across chains like Mantle and Flow.

Behind the scenes, Firework constantly monitors APY fluctuations across protocols such as Morpho, Lendle, and More.Markets. It dynamically updates positions to maintain optimal yield, ensuring that users' capital is always working as efficiently as possible. Withdrawals are just as simple: users receive their original funds plus accrued yield, directly back on Worldchain, abstracting away all of the cross-chain complexity and gas juggling.

By automating the entire DeFi strategy layer, Firework makes advanced yield farming accessible, efficient, and user-friendly.

## 🏗️ How It's Made

Firework is built on a modular, cross-chain architecture using standardized smart contract components and custom logic for real-time APY analysis and routing. At its core, it leverages the ERC-4626 vault standard to manage deposits and withdrawals in a uniform way across all supported chains.

The vaults interact with external lending protocols (e.g., Morpho on Worldchain, Lendle on Mantle) to mint and manage lzUSD, a synthetic stablecoin representing yield-bearing positions. The lzUSD Gateway serves as the bridge logic between chains, handling smart contract calls and transfers via cross-chain messaging protocols (e.g., LayerZero or Axelar, depending on integration needs).

Position updates and APY monitoring are handled through a set of off-chain bots that continuously fetch on-chain data and trigger reallocation logic via automation frameworks like Chainlink Keepers or Gelato. One particularly clever hack was the stateless abstraction of user positions: rather than tracking user state across chains, Firework tokenizes vault shares and relies on lzUSD as a unified accounting layer, which drastically reduces state management complexity.

All this allows for fast, gas-optimized rebalancing and an elegant UX that hides the multi-chain operations behind a single, seamless interface.

## 🛠️ Tech Stack

### Frontend & UI
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications
- **next-themes** - Dark/light mode support

### Authentication & Payments
- **World ID MiniKit** - Seamless authentication and payments
- **SIWE (Sign-In with Ethereum)** - Web3 authentication
- **World App Integration** - Mobile-first user experience

### Blockchain & Smart Contracts
- **Solidity 0.8.20+** - Smart contract development
- **Hardhat** - Development environment and testing
- **Foundry** - Alternative development framework
- **OpenZeppelin Contracts** - Secure smart contract libraries
- **ERC-4626** - Vault standard for yield-bearing tokens

### Cross-Chain Infrastructure
- **LayerZero v2** - Cross-chain messaging protocol
- **OFT (Omnichain Fungible Token)** - Cross-chain token standard
- **LZRead** - Cross-chain data reading
- **OApp (Omnichain Application)** - Standardized cross-chain apps

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Solhint** - Solidity linting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing

### Testing & Deployment
- **Mocha/Chai** - JavaScript testing
- **Forge** - Solidity testing
- **Hardhat Deploy** - Contract deployment
- **LayerZero DevTools** - Cross-chain development utilities

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.16.0
- pnpm (recommended) or npm
- Forge >= 0.2.0 (optional, for Solidity testing)
- World App for testing authentication and payments

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd merge
   ```

2. **Install dependencies for all projects**
   ```bash
   # Install root dependencies
   npm install
   
   # Install firework-mini-app dependencies
   cd firework-mini-app
   npm install --legacy-peer-deps
   
   # Install lzUSD dependencies
   cd ../lzUSD
   npm install
   
   # Install igniter-gateway dependencies
   cd ../igniter-gateway
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp firework-mini-app/.env.example firework-mini-app/.env.local
   cp lzUSD/.env.example lzUSD/.env
   cp igniter-gateway/.env.example igniter-gateway/.env
   ```

4. **Configure environment variables**
   ```env
   # firework-mini-app/.env.local
   NEXT_PUBLIC_WORLD_APP_ID=your_world_app_id
   LAYERZERO_ENDPOINT_ID=your_endpoint_id
   
   # lzUSD/.env & igniter-gateway/.env
   PRIVATE_KEY=your_private_key
   MNEMONIC=your_mnemonic_phrase
   ```

## 🛠️ Development Commands

### Frontend (firework-mini-app)
```bash
cd firework-mini-app

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Smart Contracts (lzUSD & igniter-gateway)
```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy contracts
npm run hardhat lz:deploy --tags MyOFTMock

# Gas profiling
npm run gas:run
```

### Cross-Chain Operations
```bash
# Set up read channels
npm run hardhat lz:oapp-read:wire --oapp-config layerzero.config.ts

# Test cross-chain reads
npm run hardhat lz:oapp-read:read --target-contract 0x... --target-eid 30101

# Send cross-chain messages
npm run hardhat lz:oapp:send --oapp-config layerzero.config.ts --target-eid 30101 --message "0x..."
```

### Testing
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:forge
npm run test:hardhat

# Run gas profiling
npm run gas:lzCompose
npm run gas:lzReceive
```

## 📁 Project Structure

```
merge/
├── firework-mini-app/          # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   └── lib/               # Utility functions
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   └── hooks/             # Custom hooks
│   │   └── lib/               # Utility functions
│   │   └── contracts/             # Smart contracts
│   │   └── public/                # Static assets
│   │   └── scripts/               # Deployment scripts
│   ├── contracts/             # Smart contracts
│   ├── public/                # Static assets
│   └── scripts/               # Deployment scripts
├── lzUSD/                     # Cross-chain token implementation
│   ├── contracts/             # lzUSD smart contracts
│   ├── deploy/                # Deployment scripts
│   └── test/                  # Test files
├── igniter-gateway/           # Cross-chain vault implementation
│   ├── contracts/             # lzUSDVault smart contracts
│   ├── deploy/                # Deployment scripts
│   └── test/                  # Test files
└── lzUSDVault/                # Additional vault implementation
```

## 🔧 Configuration

### LayerZero Configuration
```typescript
// layerzero.config.ts
export default {
  contracts: {
    MyOFTMock: {
      deploy: true,
      constructorArgs: ["lzUSD", "lzUSD", "0x...", "0x..."]
    }
  },
  networks: {
    arbitrum: {
      endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
      chainId: 42161
    },
    optimism: {
      endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", 
      chainId: 10
    }
  }
}
```

### Hardhat Configuration
```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@layerzerolabs/toolbox-hardhat";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  }
};
```

## 🧪 Testing

### Frontend Testing
```bash
# Test World ID integration
npm run test:auth

# Test payment flows
npm run test:payments

# Test cross-chain data fetching
npm run test:yield-rates
```

### Smart Contract Testing
```bash
# Run Foundry tests
forge test

# Run Hardhat tests
npx hardhat test

# Run specific test file
npx hardhat test test/MyOFT.test.ts
```

### Integration Testing
```bash
# Test cross-chain token transfers
npm run test:cross-chain

# Test vault operations
npm run test:vault

# Test yield optimization
npm run test:yield-optimization
```

## 🚀 Deployment

### Smart Contract Deployment
```bash
# Deploy to testnet
npx hardhat run deploy/lzUSD.ts --network arbitrumSepolia

# Deploy to mainnet
npx hardhat run deploy/lzUSD.ts --network arbitrum

# Verify contracts
npx hardhat verify --network arbitrum 0x...
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to other platforms
npm run deploy
```

### Environment Setup
```bash
# Set up production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_WORLD_APP_ID=your_production_app_id
export LAYERZERO_ENDPOINT_ID=your_production_endpoint_id
```

## 🔒 Security

### Smart Contract Security
- OpenZeppelin contracts for battle-tested implementations
- ReentrancyGuard for protection against reentrancy attacks
- Ownable pattern for access control
- Comprehensive testing with Foundry and Hardhat

### Frontend Security
- World ID for secure authentication
- SIWE for Web3 authentication
- Environment variable protection
- Input validation and sanitization

### Cross-Chain Security
- LayerZero v2 for secure cross-chain messaging
- DVN (Data Validation Network) integration
- Confirmation block requirements
- Message verification and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LayerZero](https://layerzero.network/) for cross-chain infrastructure
- [Worldcoin](https://worldcoin.org/) for authentication and payments
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contracts
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- **Documentation**: [Firework Docs](https://docs.firework.fi)
- **Discord**: [Firework Community](https://discord.gg/firework)
- **Twitter**: [@FireworkProtocol](https://twitter.com/FireworkProtocol)
- **Email**: support@firework.fi

---

**Firework** - Making DeFi accessible across chains 🌉
