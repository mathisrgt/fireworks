// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {OFTComposeMsgCodec} from "@layerzerolabs/oft-evm/contracts/libs/OFTComposeMsgCodec.sol";

contract lzUSDVault {
    event ComposedMessageReceived(
        address indexed originalSender,
        address indexed recipient,
        uint256 amount
    );
    event SupplyPerformed(uint256 amount);

    constructor() {}

    /**
     * @notice Handles composed messages from the OFT
     * @param _oApp Address of the originating OApp (must be trusted OFT)
     * @param _guid Unique identifier for this message
     * @param _message Encoded message containing compose data
     */
    function lzCompose(
        address _oApp,
        bytes32 _guid,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) external payable override {
        // Security: Verify the message source
        // require(msg.sender == endpoint, "TokenSwapper: unauthorized sender");
        // require(_oApp == trustedOFT, "TokenSwapper: untrusted OApp");

        // Decode the full composed message context
        uint64 nonce = OFTComposeMsgCodec.nonce(_message);
        uint32 srcEid = OFTComposeMsgCodec.srcEid(_message);
        uint256 amountLD = OFTComposeMsgCodec.amountLD(_message);

        // Get original sender (who initiated the OFT transfer)
        bytes32 composeFromBytes = OFTComposeMsgCodec.composeFrom(_message);
        address originalSender = OFTComposeMsgCodec.bytes32ToAddress(
            composeFromBytes
        );

        // Decode your custom compose message
        bytes memory composeMsg = OFTComposeMsgCodec.composeMsg(_message);
        (action, receiver) = abi.decode(composeMsg, (address, uint256));

        emit ComposedMessageReceived(originalSender, amountLD);

        // Execute the supply logic
        _performSupply(amount);
    }

    function _performSupply(uint256 amount) internal returns (uint256 amount) {
        emit SupplyPerformed(amount);
    }
}
