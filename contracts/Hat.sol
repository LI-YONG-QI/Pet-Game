// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./ERC3664/ERC3664.sol";
import "./ERC3664/extensions/ERC3664Upgradable.sol";

contract Hat is ERC721Enumerable, ERC3664, ERC3664Upgradable {
    uint8 public constant PRIMARY = 1;
    uint8 public constant LEVEL = 2;

    constructor() ERC721("Hat", "Component") ERC3664("") {
        _mint(PRIMARY, "Hat", "Primary", "");
        mintWithLevel(LEVEL, "LEVEL", "level", "", 10);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC3664, ERC721Enumerable)
        returns (bool)
    {
        return
            // interfaceId == type(ISynthetic).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
        attach(tokenId, PRIMARY, 1);
        attach(tokenId, LEVEL, 1);

        //Set primary attribute of "Hat"
        setPrimaryAttribute(tokenId, PRIMARY);
    }
}
