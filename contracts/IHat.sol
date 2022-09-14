// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IHat is IERC721 {
    function mint(uint256 tokenId) external;
}
