// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library PetData {
    bytes32 public constant GOVERNORS = keccak256("GOVERNORS");
    bytes32 public constant URI_SETTER = keccak256("URI_SETTER");

    // immutable attributes
    uint256 public constant PET_NFT = 1;

    // variable attributes
    uint256 public constant Level = 2;
    uint256 public constant Species = 3;
    uint256 public constant Characteristic = 4;
}
