// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { ReadCodecV1, EVMCallRequestV1 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/ReadCodecV1.sol";
import { OAppRead } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppRead.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title IAaveDataProvider
/// @notice Interface for Aave's PoolDataProvider contract
interface IAaveDataProvider {
    function getReserveData(address asset) external view returns (
        uint256 availableLiquidity,
        uint256 totalStableDebt, 
        uint256 totalVariableDebt,
        uint256 liquidityRate,
        uint256 variableBorrowRate,
        uint256 stableBorrowRate,
        uint256 averageStableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex,
        uint40 lastUpdateTimestamp
    );
}

/// @title IMorpho  
/// @notice Interface for Morpho Blue contract
interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken; 
        address oracle;
        address irm;
        uint256 lltv;
    }
    
    struct Market {
        uint128 totalSupplyAssets;
        uint128 totalSupplyShares;
        uint128 totalBorrowAssets;
        uint128 totalBorrowShares;
        uint128 lastUpdate;
        uint128 fee;
    }
    
    function market(bytes32 id) external view returns (Market memory);
    function idToMarketParams(bytes32 id) external view returns (MarketParams memory);
}

/// @title YieldRateReader
/// @notice Cross-chain yield rate reader using LayerZero LZRead
contract YieldRateReader is OAppRead, OAppOptionsType3 {
    
    /// @notice Emitted when yield rates are received
    event YieldRatesReceived(uint256 aaveRate, uint256 morphoRate, uint256 timestamp);
    
    /// @notice LayerZero read channel ID
    uint32 public READ_CHANNEL;
    
    /// @notice Message type for yield rate reads
    uint16 public constant READ_TYPE = 1;
    
    /// @notice Target chain endpoint ID (Ethereum mainnet)
    uint32 public constant TARGET_EID = 30101;
    
    /// @notice Contract addresses on target chain
    address public constant AAVE_DATA_PROVIDER = 0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3;
    address public constant MORPHO_CONTRACT = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    address public constant USDC_TOKEN = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    /// @notice Morpho market ID for USDC (example - needs to be actual market ID)
    bytes32 public constant MORPHO_USDC_MARKET_ID = 0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc;
    
    /// @notice Latest yield rates
    uint256 public latestAaveRate;
    uint256 public latestMorphoRate;
    uint256 public lastUpdateTimestamp;

    constructor(
        address _endpoint,
        uint32 _readChannel
    ) OAppRead(_endpoint, msg.sender) Ownable(msg.sender) {
        READ_CHANNEL = _readChannel;
        _setPeer(READ_CHANNEL, AddressCast.toBytes32(address(this)));
    }

    /// @notice Read yield rates from both Aave and Morpho
    /// @param _extraOptions Additional execution options
    /// @return receipt LayerZero messaging receipt
    function readYieldRates(
        bytes calldata _extraOptions
    ) external payable returns (MessagingReceipt memory) {
        bytes memory cmd = _buildReadCommand();
        
        return _lzSend(
            READ_CHANNEL,
            cmd,
            combineOptions(READ_CHANNEL, READ_TYPE, _extraOptions),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    /// @notice Quote the fee for reading yield rates
    /// @param _extraOptions Additional execution options  
    /// @return fee Estimated messaging fee
    function quoteReadFee(
        bytes calldata _extraOptions
    ) external view returns (MessagingFee memory fee) {
        return _quote(
            READ_CHANNEL, 
            _buildReadCommand(), 
            combineOptions(READ_CHANNEL, READ_TYPE, _extraOptions), 
            false
        );
    }

    /// @notice Build read command for both protocols
    /// @return cmd Encoded read command
    function _buildReadCommand() internal view returns (bytes memory) {
        EVMCallRequestV1[] memory readRequests = new EVMCallRequestV1[](2);
        
        // Request 1: Aave USDC liquidity rate
        readRequests[0] = EVMCallRequestV1({
            appRequestLabel: 1,
            targetEid: TARGET_EID,
            isBlockNum: false,
            blockNumOrTimestamp: uint64(block.timestamp),
            confirmations: 15,
            to: AAVE_DATA_PROVIDER,
            callData: abi.encodeWithSelector(
                IAaveDataProvider.getReserveData.selector,
                USDC_TOKEN
            )
        });
        
        // Request 2: Morpho USDC market data
        readRequests[1] = EVMCallRequestV1({
            appRequestLabel: 2, 
            targetEid: TARGET_EID,
            isBlockNum: false,
            blockNumOrTimestamp: uint64(block.timestamp),
            confirmations: 15,
            to: MORPHO_CONTRACT,
            callData: abi.encodeWithSelector(
                IMorpho.market.selector,
                MORPHO_USDC_MARKET_ID
            )
        });
        
        return ReadCodecV1.encode(0, readRequests);
    }

    /// @notice Process received yield rate data
    /// @param _message Encoded response data from target chains
    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // Decode the response data for both requests
        bytes[] memory responses = abi.decode(_message, (bytes[]));
        
        require(responses.length == 2, "Invalid response count");
        
        // Parse Aave response (liquidityRate is the 4th return value)
        (,,,uint256 aaveLiquidityRate,,,,,,,) = abi.decode(
            responses[0], 
            (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40)
        );
        
        // Parse Morpho response
        IMorpho.Market memory morphoMarket = abi.decode(responses[1], (IMorpho.Market));
        
        // Calculate Morpho supply rate (simplified - actual calculation more complex)
        uint256 morphoSupplyRate = _calculateMorphoSupplyRate(morphoMarket);
        
        // Update state
        latestAaveRate = aaveLiquidityRate;
        latestMorphoRate = morphoSupplyRate;
        lastUpdateTimestamp = block.timestamp;
        
        emit YieldRatesReceived(aaveLiquidityRate, morphoSupplyRate, block.timestamp);
    }
    
    /// @notice Calculate Morpho supply rate from market data
    /// @param market Morpho market struct
    /// @return supplyRate Calculated supply rate
    function _calculateMorphoSupplyRate(IMorpho.Market memory market) internal pure returns (uint256) {
        // Simplified calculation - actual Morpho rate calculation is more complex
        // This should include utilization rate, borrow rate, and other factors
        if (market.totalSupplyAssets == 0) return 0;
        
        uint256 utilization = (market.totalBorrowAssets * 1e18) / market.totalSupplyAssets;
        // This is a placeholder - implement actual Morpho rate calculation
        return utilization / 100; // Simplified rate calculation
    }

    /// @notice Set read channel configuration
    /// @param _channelId Channel ID to configure
    /// @param _active Whether to activate the channel
    function setReadChannel(uint32 _channelId, bool _active) public override onlyOwner {
        _setPeer(_channelId, _active ? AddressCast.toBytes32(address(this)) : bytes32(0));
        READ_CHANNEL = _channelId;
    }
    
    /// @notice Get current yield rates
    /// @return aaveRate Current Aave USDC supply rate
    /// @return morphoRate Current Morpho USDC supply rate  
    /// @return timestamp Last update timestamp
    function getCurrentRates() external view returns (uint256 aaveRate, uint256 morphoRate, uint256 timestamp) {
        return (latestAaveRate, latestMorphoRate, lastUpdateTimestamp);
    }
} 