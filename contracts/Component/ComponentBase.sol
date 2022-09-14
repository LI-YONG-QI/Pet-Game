// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../ERC3664/ERC3664.sol";
import "../ERC3664/extensions/ERC3664Upgradable.sol";

contract ComponentBase is ERC721Enumerable, ERC3664 {
    uint8 public constant PRIMARY = 1;

    struct subToken {
        address primaryToken;
        uint256 primaryTokenId;
    }

    mapping(uint256 => subToken) public subTokens;

    constructor(string memory _name, string memory _symbol)
        ERC721("COMPONENT", "component")
        ERC3664("")
    {
        _mint(PRIMARY, _name, _symbol, "");
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC3664, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function mint(uint256 primaryTokenId, uint256 tokenId) public virtual {
        _mint(msg.sender, tokenId);
        attach(tokenId, PRIMARY, 1);
        setPrimaryAttribute(tokenId, PRIMARY);
        recordSubTokens(tokenId, msg.sender, primaryTokenId);
    }

    function recordSubTokens(
        uint256 tokenId,
        address primaryToken,
        uint256 primaryTokenId
    ) internal {
        subTokens[tokenId] = subToken(primaryToken, primaryTokenId);
    }

    function getSubTokens(uint256 tokenId)
        public
        view
        returns (subToken memory)
    {
        return subTokens[tokenId];
    }
}
