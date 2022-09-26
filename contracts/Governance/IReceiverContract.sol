// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IReceiverContract {
    function addMember(address _member, uint256 royalties) external;
}
