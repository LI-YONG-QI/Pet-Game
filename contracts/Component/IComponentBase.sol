// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../ERC3664/IERC3664.sol";
import {IERC3664TextBased} from "../ERC3664/extensions/IERC3664TextBased.sol";

interface IComponentBase is IERC721, IERC3664TextBased {
    function mint() external;

    function recordSubTokens(
        uint256 tokenId,
        address primaryToken,
        uint256 primaryTokenId
    ) external;

    function getCurrentTokenId() external returns (uint256);

    function defaultMint() external;
}
