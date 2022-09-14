// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../ERC3664/IERC3664.sol";

interface IComponentBase is IERC721, IERC3664 {
    function mint(uint256 primaryToken, uint256 primaryTokenId) external;
}
