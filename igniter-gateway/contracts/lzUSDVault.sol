// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Interface for lzUSD
 */
interface ILzUSD {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

/**
 * @title lzUSDVault - Cross-Chain Yield Vault
 * @notice ERC4626 vault that generates yield from lending protocols across chains
 * @dev Integrates with lzUSD token for cross-chain functionality
 */
contract lzUSDVault is ERC4626, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event YieldHarvested(uint256 amount);
    event Rebalanced(uint32 fromChain, uint32 toChain, uint256 amount);
    event APYUpdated(uint256 newAPY);
    event ChainAdded(uint32 indexed chainId, address indexed lendingProtocol);

    // Errors
    error InsufficientLiquidity();
    error InvalidChain();
    error UnauthorizedCall();
    error ZeroAmount();

    // Constants
    uint256 private constant PRECISION = 1e18;
    uint256 private constant REBALANCE_THRESHOLD = 100e18; // 100 USD threshold
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    // State variables
    ILzUSD public immutable lzUSD;
    
    mapping(uint32 => address) public chainLendingProtocols; // chainId -> lending protocol
    mapping(uint32 => uint256) public chainLiquidity; // chainId -> total liquidity
    mapping(uint32 => uint256) public chainAPY; // chainId -> APY (scaled by 1e18)
    
    uint32[] public supportedChains;
    uint256 public totalSupplyAPY;
    uint256 public lastHarvestTime;
    uint256 public accumulatedYield;
    uint32 public currentChainId;

    // Vault name and symbol
    string private _vaultName;
    string private _vaultSymbol;

    // Lending protocol interface
    interface ILendingProtocol {
        function supply(address asset, uint256 amount) external;
        function withdraw(address asset, uint256 amount) external returns (uint256);
        function getSupplyBalance(address asset, address user) external view returns (uint256);
        function getSupplyAPY(address asset) external view returns (uint256);
    }

    modifier onlyLzUSD() {
        require(msg.sender == address(lzUSD), "Only lzUSD");
        _;
    }

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _lzUSD,
        uint32 _currentChainId
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        lzUSD = ILzUSD(_lzUSD);
        currentChainId = _currentChainId;
        lastHarvestTime = block.timestamp;
        
        // Set vault name and symbol
        _vaultName = _name;
        _vaultSymbol = _symbol;
    }

    /**
     * @notice Add a supported chain with its lending protocol
     * @param _chainId Chain ID
     * @param _lendingProtocol Address of lending protocol on that chain
     */
    function addSupportedChain(uint32 _chainId, address _lendingProtocol) external onlyOwner {
        require(_lendingProtocol != address(0), "Invalid protocol");
        require(chainLendingProtocols[_chainId] == address(0), "Chain already added");
        
        chainLendingProtocols[_chainId] = _lendingProtocol;
        supportedChains.push(_chainId);
        
        emit ChainAdded(_chainId, _lendingProtocol);
    }

    /**
     * @notice Deposit assets and mint lzUSD tokens
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive lzUSD tokens
     */
    function deposit(uint256 assets, address receiver) 
        public 
        override 
        nonReentrant 
        returns (uint256 shares) 
    {
        require(assets > 0, "Zero deposit");
        
        // Calculate shares
        shares = previewDeposit(assets);
        
        // Transfer assets from user
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        
        // Supply to lending protocol
        _supplyToLendingProtocol(assets);
        
        // Mint lzUSD tokens to receiver
        lzUSD.mint(receiver, shares);
        
        // Update liquidity tracking
        chainLiquidity[currentChainId] += assets;
        
        // Update total supply for ERC4626 tracking
        _mint(address(this), shares);
        
        emit Deposit(msg.sender, assets, shares);
        
        return shares;
    }

    /**
     * @notice Withdraw assets by burning lzUSD tokens
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive assets
     * @param owner Address that owns the lzUSD tokens
     */
    function withdraw(uint256 assets, address receiver, address owner) 
        public 
        override 
        nonReentrant 
        returns (uint256 shares) 
    {
        require(assets > 0, "Zero withdrawal");
        
        // Calculate shares to burn
        shares = previewWithdraw(assets);
        
        // Harvest yield before withdrawal
        _harvestYield();
        
        // Burn lzUSD tokens
        lzUSD.burn(owner, shares);
        
        // Withdraw from lending protocol
        uint256 withdrawn = _withdrawFromLendingProtocol(assets);
        
        // Transfer assets to receiver
        IERC20(asset()).safeTransfer(receiver, withdrawn);
        
        // Update liquidity tracking
        chainLiquidity[currentChainId] -= assets;
        
        // Update total supply for ERC4626 tracking
        _burn(address(this), shares);
        
        emit Withdraw(msg.sender, withdrawn, shares);
        
        // Check if rebalancing is needed
        _checkRebalancing();
        
        return shares;
    }

    /**
     * @notice Handle cross-chain messages from lzUSD
     * @param action Action type (1 = deposit, 2 = withdraw)
     * @param receiver Address to receive tokens/assets
     * @param amount Amount involved in the action
     */
    function handleCrossChainMessage(
        uint8 action,
        address receiver,
        uint256 amount
    ) external onlyLzUSD {
        if (action == 1) {
            // Cross-chain deposit: mint lzUSD tokens
            uint256 shares = previewDeposit(amount);
            lzUSD.mint(receiver, shares);
            chainLiquidity[currentChainId] += amount;
            _mint(address(this), shares);
            emit Deposit(receiver, amount, shares);
        } else if (action == 2) {
            // Cross-chain withdraw: burn lzUSD and send assets
            _harvestYield();
            uint256 withdrawn = _withdrawFromLendingProtocol(amount);
            IERC20(asset()).safeTransfer(receiver, withdrawn);
            chainLiquidity[currentChainId] -= amount;
            uint256 shares = previewWithdraw(amount);
            _burn(address(this), shares);
            emit Withdraw(receiver, withdrawn, shares);
            _checkRebalancing();
        }
    }

    /**
     * @notice Update APY for a specific chain
     * @param _chainId Chain ID to update
     * @param _apy New APY value (scaled by 1e18)
     */
    function updateChainAPY(uint32 _chainId, uint256 _apy) external onlyOwner {
        require(chainLendingProtocols[_chainId] != address(0), "Chain not supported");
        chainAPY[_chainId] = _apy;
        _updateTotalAPY();
    }

    /**
     * @notice Harvest yield from lending protocol
     */
    function harvestYield() external {
        _harvestYield();
    }

    /**
     * @notice Get total assets including accrued yield
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + 
               _getSuppliedBalance() + 
               _getAccruedYield();
    }

    /**
     * @notice Preview deposit shares
     */
    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Down);
    }

    /**
     * @notice Preview withdraw shares
     */
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Up);
    }

    /**
     * @notice Get vault name
     */
    function name() public view override returns (string memory) {
        return _vaultName;
    }

    /**
     * @notice Get vault symbol
     */
    function symbol() public view override returns (string memory) {
        return _vaultSymbol;
    }

    // Internal functions

    function _supplyToLendingProtocol(uint256 amount) internal {
        address protocol = chainLendingProtocols[currentChainId];
        if (protocol != address(0)) {
            IERC20(asset()).safeApprove(protocol, amount);
            ILendingProtocol(protocol).supply(asset(), amount);
        }
    }

    function _withdrawFromLendingProtocol(uint256 amount) internal returns (uint256) {
        address protocol = chainLendingProtocols[currentChainId];
        if (protocol != address(0)) {
            return ILendingProtocol(protocol).withdraw(asset(), amount);
        }
        return amount;
    }

    function _getSuppliedBalance() internal view returns (uint256) {
        address protocol = chainLendingProtocols[currentChainId];
        if (protocol != address(0)) {
            return ILendingProtocol(protocol).getSupplyBalance(asset(), address(this));
        }
        return 0;
    }

    function _harvestYield() internal {
        uint256 timePassed = block.timestamp - lastHarvestTime;
        if (timePassed > 0) {
            uint256 yieldAmount = _getAccruedYield();
            if (yieldAmount > 0) {
                accumulatedYield += yieldAmount;
                lastHarvestTime = block.timestamp;
                emit YieldHarvested(yieldAmount);
            }
        }
    }

    function _getAccruedYield() internal view returns (uint256) {
        if (totalSupplyAPY == 0) return 0;
        
        uint256 timePassed = block.timestamp - lastHarvestTime;
        uint256 suppliedBalance = _getSuppliedBalance();
        
        return (suppliedBalance * totalSupplyAPY * timePassed) / (SECONDS_PER_YEAR * PRECISION);
    }

    function _updateTotalAPY() internal {
        uint256 totalWeightedAPY = 0;
        uint256 totalLiquidity = 0;
        
        for (uint256 i = 0; i < supportedChains.length; i++) {
            uint32 chainId = supportedChains[i];
            uint256 apy = chainAPY[chainId];
            uint256 liquidity = chainLiquidity[chainId];
            
            totalWeightedAPY += apy * liquidity;
            totalLiquidity += liquidity;
        }
        
        if (totalLiquidity > 0) {
            totalSupplyAPY = totalWeightedAPY / totalLiquidity;
        }
        
        emit APYUpdated(totalSupplyAPY);
    }

    function _checkRebalancing() internal {
        if (supportedChains.length < 2) return;
        
        uint32 maxChain = supportedChains[0];
        uint32 minChain = supportedChains[0];
        uint256 maxLiquidity = chainLiquidity[maxChain];
        uint256 minLiquidity = chainLiquidity[minChain];
        
        // Find chains with max and min liquidity
        for (uint256 i = 1; i < supportedChains.length; i++) {
            uint32 chainId = supportedChains[i];
            uint256 liquidity = chainLiquidity[chainId];
            
            if (liquidity > maxLiquidity) {
                maxLiquidity = liquidity;
                maxChain = chainId;
            }
            
            if (liquidity < minLiquidity) {
                minLiquidity = liquidity;
                minChain = chainId;
            }
        }
        
        // Check if rebalancing is needed
        if (maxLiquidity > minLiquidity && 
            maxLiquidity - minLiquidity > REBALANCE_THRESHOLD) {
            uint256 rebalanceAmount = (maxLiquidity - minLiquidity) / 2;
            _triggerRebalance(maxChain, minChain, rebalanceAmount);
        }
    }

    function _triggerRebalance(uint32 fromChain, uint32 toChain, uint256 amount) internal {
        // This would trigger cross-chain rebalancing via Stargate
        // For now, just emit event - actual implementation would involve cross-chain calls
        emit Rebalanced(fromChain, toChain, amount);
    }

    // Override ERC4626 conversion functions
    function _convertToShares(uint256 assets, Math.Rounding rounding) 
        internal 
        view 
        override 
        returns (uint256) 
    {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    function _convertToAssets(uint256 shares, Math.Rounding rounding) 
        internal 
        view 
        override 
        returns (uint256) 
    {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : (shares * totalAssets()) / supply;
    }
}