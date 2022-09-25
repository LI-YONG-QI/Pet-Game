// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../ERC3664/ERC3664.sol";
import "../ERC3664/extensions/ERC3664Upgradable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC3664TextBased} from "../ERC3664/extensions/ERC3664TextBased.sol";

contract ComponentBase is ERC721Enumerable, ERC3664, ERC3664TextBased, Ownable {
    using Strings for uint256;

    uint8 public constant PRIMARY = 1;
    uint256 public currentTokenId = 0;
    string public primaryText;

    string public baseURI;

    struct subToken {
        address primaryToken;
        uint256 primaryTokenId;
    }

    mapping(uint256 => subToken) public subTokens;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory text
    ) ERC721("COMPONENT", "component") ERC3664("") {
        primaryText = text;
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

    function mint() public virtual {
        _mint(msg.sender, currentTokenId);
        attachWithText(currentTokenId, PRIMARY, 1, bytes(primaryText));
        setPrimaryAttribute(currentTokenId, PRIMARY);
        currentTokenId++;
    }

    function recordSubTokens(
        uint256 tokenId,
        address primaryToken,
        uint256 primaryTokenId
    ) public {
        subTokens[tokenId] = subToken(primaryToken, primaryTokenId);
    }

    function getSubTokens(uint256 tokenId)
        public
        view
        returns (subToken memory)
    {
        return subTokens[tokenId];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI) public onlyOwner {
        baseURI = newURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        ".json"
                    )
                )
                : "";
    }

    function getCurrentTokenId() public view returns (uint256) {
        return currentTokenId;
    }
}
