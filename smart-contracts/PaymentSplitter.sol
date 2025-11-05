// smart-contracts/PaymentSplitter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentSplitter {
    address public owner;
    IERC20 public usdcToken;
    
    event PaymentExecuted(
        address indexed payer,
        address[] recipients,
        uint256[] amounts,
        uint256 total
    );

    constructor(address _usdcAddress) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcAddress);
    }

    function executePayment(
        address[] memory recipients,
        uint256[] memory amounts
    ) external returns (bool) {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(
            usdcToken.transferFrom(msg.sender, address(this), totalAmount),
            "USDC transfer failed"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                usdcToken.transfer(recipients[i], amounts[i]),
                "Recipient transfer failed"
            );
        }

        emit PaymentExecuted(msg.sender, recipients, amounts, totalAmount);
        return true;
    }
}