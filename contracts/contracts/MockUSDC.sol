// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC - Mock USDC token for testing
 * @dev Simulates USDC on testnet with 6 decimals
 */
contract MockUSDC is ERC20 {
    uint8 private _decimals;

    constructor(uint8 decimals_) ERC20("Mock USDC", "mUSDC") {
        _decimals = decimals_;
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10 ** decimals_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens for testing
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens for testing
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}