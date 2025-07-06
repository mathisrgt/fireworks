// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
contract lzUSD is OFT {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken;
    address public vault;

    // Events
    event Deposit(address indexed user, uint256 usdcAmount, uint256 lzUSDAmount);
    event Withdraw(address indexed user, uint256 usdcAmount, uint256 lzUSDAmount);
    event CrossChainDeposit(address indexed user, uint32 indexed dstChain, uint256 amount);
    event CrossChainWithdraw(address indexed user, uint32 indexed dstChain, uint256 amount);
    event CrossChainDepositReceived(address indexed user, uint256 amount);
    event CrossChainWithdrawReceived(address indexed user, uint256 amount);

    // Errors
    error UnauthorizedCompose();
    error InvalidComposeMessage();
    error InsufficientBalance();

    // Compose message actions
    uint8 constant DEPOSIT_ACTION = 1;
    uint8 constant WITHDRAW_ACTION = 2;

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {
        underlyingToken = IERC20("0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"); // Local USDC
    }

    /**
     * @notice Set the vault address (can only be called once)
     * @param _vault Address of the lzUSDVault contract
     */
    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault already set");
        vault = _vault;
    }

    /**
     * @notice Mint tokens (only callable by vault)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens (only callable by vault)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
    }

    /**
     * @notice Deposit underlying tokens and mint lzUSD to sender
     * @param _amount Amount of underlying tokens to deposit
     */
    function deposit(uint256 _amount) external {
        // Transfer underlying tokens from user to vault
        underlyingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate lzUSD amount to mint (1:1 ratio, accounting for decimals)
        uint256 lzUSDAmount = _amount; // Assuming USDC has 6 decimals, lzUSD has 18

        // Mint lzUSD to user
        _mint(msg.sender, lzUSDAmount);

        emit Deposit(msg.sender, _amount, lzUSDAmount);
    }

    /**
     * @notice Withdraw underlying tokens by burning lzUSD
     * @param _lzUSDAmount Amount of lzUSD to burn
     */
    function withdraw(uint256 _lzUSDAmount) external {
        // Calculate underlying token amount to return
        uint256 underlyingAmount = _lzUSDAmount; // Convert back to USDC decimals

        // Check if vault has enough underlying tokens
        if (underlyingToken.balanceOf(address(this)) < underlyingAmount) {
            revert InsufficientBalance();
        }

        // Burn lzUSD from user
        _burn(msg.sender, _lzUSDAmount);

        // Transfer underlying tokens back to user
        underlyingToken.safeTransfer(msg.sender, underlyingAmount);

        emit Withdraw(msg.sender, underlyingAmount, _lzUSDAmount);
    }

    /**
     * @notice Send tokens cross-chain with compose message
     * @param _dstEid Destination chain endpoint ID
     * @param _amount Amount to send
     * @param _receiver Final receiver address (end recipient)
     * @param _action Action type (1 = deposit, 2 = withdraw)
     * @param _extraOptions Additional LayerZero options (optional)
     */
    function sendCompose(
        uint32 _dstEid,
        uint256 _amount,
        address _receiver, // composer contract
        uint8 _action,
        bytes calldata _extraOptions
    ) external payable {
        require(_action == DEPOSIT_ACTION || _action == WITHDRAW_ACTION, "Invalid action");

        _burn(msg.sender, _amount);

        // Prepare compose message with your custom data
        bytes memory composeMsg = abi.encode(_action, _receiver, _amount);

        // Send the OFT with compose message
        _lzSend(
            _dstEid,
            abi.encode(_receiver, _amount),
            _extraOptions,
            MessagingFee(msg.value, 0),
            payable(msg.sender),
            composeMsg
        );

        if (_action == DEPOSIT_ACTION) {
            emit CrossChainDeposit(_receiver, _dstEid, _amount);
        } else {
            emit CrossChainWithdraw(_receiver, _dstEid, _amount);
        }
    }

    /**
     * @notice Handle composed messages from LayerZero
     * @param _from Source address
     * @param _guid Message GUID
     * @param _message Composed message
     * @param _executor Executor address
     * @param _extraData Extra data
     */
    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable {
        (uint8 action, address receiver, uint256 amount) = abi.decode(_message, (uint8, address, uint256));

        require(action == DEPOSIT_ACTION || action == WITHDRAW_ACTION, "Invalid action");

        if (action == DEPOSIT_ACTION) {
            _mint(receiver, amount);
            emit CrossChainDepositReceived(receiver, amount);
        } else {
            if (balanceOf(receiver) < amount) {
                revert InsufficientBalance();
            }
            _burn(receiver, amount);
            emit CrossChainWithdrawReceived(receiver, amount);
        }
    }

    /**
     * @notice Get quote for cross-chain send
     * @param _dstEid Destination endpoint ID
     * @param _amount Amount to send
     * @param _receiver Receiver address
     * @param _options LayerZero options
     * @param _payInLzToken Whether to pay in LZ token
     * @param _composeMsg Optional compose message
     */
    function quoteSend(
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        bytes memory _options,
        bool _payInLzToken,
        bytes memory _composeMsg
    ) external view returns (MessagingFee memory fee) {
        // Encode the message in the same format as _lzSend
        bytes memory message = abi.encode(_receiver, _amount);

        // Use the OFT's internal _quote function
        return _quote(_dstEid, message, _options, _payInLzToken, _composeMsg);
    }

    /**
     * @notice Get quote for cross-chain send with compose (simplified version)
     * @param _dstEid Destination endpoint ID
     * @param _amount Amount to send
     * @param _receiver Receiver address
     * @param _action Action type (1 = deposit, 2 = withdraw)
     * @param _options LayerZero options
     */
    function quoteCompose(
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        uint8 _action,
        bytes memory _options
    ) external view returns (MessagingFee memory fee) {
        require(_action == DEPOSIT_ACTION || _action == WITHDRAW_ACTION, "Invalid action");

        // Prepare the same message format as sendCompose
        bytes memory message = abi.encode(_receiver, _amount);
        bytes memory composeMsg = abi.encode(_action, _receiver, _amount);

        // Get quote with compose message
        return _quote(_dstEid, message, _options, false, composeMsg);
    }
}
