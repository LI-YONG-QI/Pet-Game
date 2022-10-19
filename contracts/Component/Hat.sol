// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../ERC3664/ERC3664.sol";
import "../ERC3664/extensions/ERC3664Upgradable.sol";
import "./ComponentBase.sol";

contract Hat is ComponentBase, ERC3664Upgradable {
    uint8 public defaultMintIndex = 0;
    uint8 public constant LEVEL = 2;

    event Deposit(address sender, uint256 amount, uint256 balance);

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    constructor() ComponentBase("HAT", "hat", "HatComponent") {
        mintWithLevel(LEVEL, "LEVEL", "level", "", 10);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC3664, ComponentBase)
        returns (bool)
    {
        return
            // interfaceId == type(ISynthetic).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint() public virtual override {
        super.mint();
        attach(currentTokenId, LEVEL, 1);
    }

    function defaultMint() public virtual override {
        _mint(msg.sender, defaultMintIndex);
        attachWithText(defaultMintIndex, PRIMARY, 1, bytes(primaryText));
        setPrimaryAttribute(defaultMintIndex, PRIMARY);
        defaultMintIndex++;
    }
}
