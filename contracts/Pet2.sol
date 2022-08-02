// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Pet2 is Ownable {
    uint256 public count = 1;
    event Deposit(address sender, uint256 amount, uint256 balance);

    constructor() {}

    fallback() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
}
