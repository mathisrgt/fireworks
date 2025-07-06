# LayerZero LZRead Integration for Firework Mini App

This document explains the LayerZero LZRead integration that enables real-time yield rate fetching from Aave V3 and Morpho protocols.

## Overview

The Firework Mini App now includes LayerZero LZRead integration to fetch live yield rates from Ethereum mainnet protocols. This provides:

- **Real-time Data**: Live APY rates from Aave V3 and Morpho Blue
- **Cross-chain Verification**: Cryptographically verified data from Ethereum
- **Trustless Architecture**: No reliance on centralized oracles
- **Cost-effective**: Pay-per-query model

## Architecture

### Smart Contract: `YieldRateReader.sol`

Located in `contracts/YieldRateReader.sol`, this contract:

1. **Sends Read Requests**: Uses LayerZero LZRead to query Aave and Morpho contracts
2. **Processes Responses**: Decodes and stores yield rate data
3. **Emits Events**: Notifies frontend of new rate updates

### Frontend Integration

- **Hook**: `src/hooks/useYieldRates.ts` - Manages yield rate state and LayerZero interactions
- **Component**: `src/components/LiveRatesDisplay.tsx` - Displays live rates with visual indicators
- **Assets Page**: Updated to use live data instead of static mock data

## Key Features

### Live Rate Indicators
- **Green Dots**: Indicate protocols with live LayerZero data (Aave & Morpho)
- **Refresh Button**: Manually trigger new rate fetches
- **Timestamp Display**: Shows when rates were last updated

### Protocol Support
- **Aave V3**: USDC supply rates from Ethereum mainnet
- **Morpho Blue**: USDC lending rates from Ethereum mainnet
- **Other Protocols**: Display cached rates (can be extended with more LayerZero integrations)

## Contract Addresses

### Target Chain (Ethereum Mainnet)
- **Aave Data Provider**: `0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3`
- **Morpho Blue**: `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`
- **USDC Token**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

### Deployment Chain (Arbitrum)
- **LayerZero Endpoint**: `0x3c2269811836af69497E5F486A85D7316753cf62`

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
ARBITRUM_RPC_URL=your_arbitrum_rpc_url
ARBISCAN_API_KEY=your_arbiscan_api_key
```

### 3. Deploy Contract
```bash
npx hardhat run scripts/deploy-yield-reader.ts --network arbitrum
```

### 4. Configure LayerZero
```bash
# Set up read channels
npx hardhat lz:oapp-read:wire --oapp-config layerzero.config.ts

# Test read operation
npx hardhat lz:oapp-read:read --target-contract 0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3 --target-eid 30101
```

### 5. Update Frontend
Update the contract address in `src/hooks/useYieldRates.ts`:
```typescript
const YIELD_READER_ADDRESS = "your_deployed_contract_address";
```

## Usage

### Frontend
The Live Rates section automatically:
1. Loads cached rates on page load
2. Displays live indicators for Aave and Morpho
3. Allows manual refresh via "Fetch Live" button
4. Shows timestamps for rate updates

### Smart Contract
```solidity
// Read current rates
(uint256 aaveRate, uint256 morphoRate, uint256 timestamp) = yieldReader.getCurrentRates();

// Request fresh rates
yieldReader.readYieldRates("0x");

// Quote fee
MessagingFee memory fee = yieldReader.quoteReadFee("0x");
```

## Development

### Adding New Protocols
1. Add protocol interface to `YieldRateReader.sol`
2. Update `_buildReadCommand()` with new read requests
3. Add protocol to `MOCK_PROTOCOLS` in `useYieldRates.ts`
4. Update `LiveRatesDisplay.tsx` for visual indicators

### Testing
```bash
# Test contract compilation
npx hardhat compile

# Run tests (when implemented)
npx hardhat test

# Deploy to testnet
npx hardhat run scripts/deploy-yield-reader.ts --network arbitrumSepolia
```

## Security Considerations

- **DVN Selection**: Choose trusted Data Validation Networks
- **Confirmation Blocks**: Set appropriate confirmation requirements
- **Rate Limiting**: Implement frontend rate limiting for read requests
- **Error Handling**: Graceful fallback to cached data on failures

## Cost Analysis

- **Read Requests**: ~$0.01-0.05 per request (varies by network)
- **Gas Costs**: Minimal on Arbitrum
- **No Ongoing Fees**: Pay only when fetching new data

## Future Enhancements

- [ ] Add more protocols (Compound, Spark, etc.)
- [ ] Implement rate caching optimization
- [ ] Add historical rate tracking
- [ ] Create yield optimization recommendations
- [ ] Add protocol comparison features

## Troubleshooting

### Common Issues
1. **Contract Not Found**: Ensure correct deployment and address
2. **Read Failures**: Check LayerZero configuration and DVN status
3. **High Gas Costs**: Optimize read request frequency
4. **Stale Data**: Verify timestamp validation logic

### Support
For LayerZero-specific issues, refer to:
- [LayerZero Documentation](https://docs.layerzero.network/)
- [LZRead Guide](https://docs.layerzero.network/developers/evm/lzread)
- [Community Discord](https://discord.gg/layerzero) 