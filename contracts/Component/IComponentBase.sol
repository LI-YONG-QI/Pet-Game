// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../ERC3664/IERC3664.sol";
import {IERC3664TextBased} from "../ERC3664/extensions/IERC3664TextBased.sol";

interface IComponentBase is IERC721, IERC3664TextBased {
    function mint(uint256 primaryToken, uint256 primaryTokenId) external;
}
