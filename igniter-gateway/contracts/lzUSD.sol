// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { ILzCompose } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/interfaces/ILzCompose.sol";
import { MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";

/**
 * @title lzUSD - Cross-Chain Yield Token
 * @notice OFT token for cross-chain yield vault system
 * @dev Handles cross-chain transfers and compose messages
 */
contract lzUSD is OFT, ILzCompose {
    // Events
    event CrossChainDeposit(address indexed user, uint32 indexed srcChain, uint256 amount);
    event CrossChainWithdraw(address indexed user, uint32 indexed dstChain, uint256 amount);

    // Errors
    error UnauthorizedCompose();
    error InvalidComposeMessage();

    // State variables
    address public vault;

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
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {}

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
     * @notice Send tokens cross-chain with compose message
     * @param _dstEid Destination chain endpoint ID
     * @param _amount Amount to send
     * @param _receiver Receiver address
     * @param _action Action type (1 = deposit, 2 = withdraw)
     * @param _options LayerZero options
     */
    function sendWithCompose(
        uint32 _dstEid,
        uint256 _amount,
        address _receiver,
        uint8 _action,
        bytes calldata _options
    ) external payable {
        require(_action == DEPOSIT_ACTION || _action == WITHDRAW_ACTION, "Invalid action");

        // Prepare compose message
        bytes memory composeMsg = abi.encode(_action, _receiver, _amount);

        // Send OFT with compose message
        _lzSend(
            _dstEid,
            abi.encode(_receiver, _amount),
            _options,
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
    ) external payable override {
        require(msg.sender == address(endpoint), "Unauthorized");

        // Decode message
        (uint8 action, address receiver, uint256 amount) = abi.decode(_message, (uint8, address, uint256));

        require(action == DEPOSIT_ACTION || action == WITHDRAW_ACTION, "Invalid action");

        // Forward to vault for processing
        ILzUSDVault(vault).handleCrossChainMessage(action, receiver, amount);
    }

    /**
     * @notice Get quote for cross-chain send
     * @param _dstEid Destination endpoint ID
     * @param _message Message to send
     * @param _options LayerZero options
     * @param _payInLzToken Whether to pay in LZ token
     */
    function quoteSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        return _quote(_dstEid, _message, _options, _payInLzToken);
    }
}

/**
 * @title Interface for lzUSDVault
 */
interface ILzUSDVault {
    function handleCrossChainMessage(uint8 action, address receiver, uint256 amount) external;
}

/**
 * @title Interface for lzUSD
 */
interface ILzUSD {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
