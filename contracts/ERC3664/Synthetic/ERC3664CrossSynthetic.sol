// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../extensions/ERC3664TextBased.sol";
import {SyntheticData} from "../utils/SyntheticData.sol";

/**
 * @dev Implementation of the {ERC3664CrossSynthetic} interface.
 */
abstract contract ERC3664CrossSynthetic is ERC3664TextBased {
    // mainToken => SynthesizedToken
    mapping(uint256 => SyntheticData.SynthesizedToken[])
        public synthesizedTokens;

    mapping(string => address) components;
    mapping(uint256 => string) componentsName;

    uint256 public componentsAmount = 0;

    function getSynthesizedTokens(uint256 tokenId)
        public
        view
        returns (SyntheticData.SynthesizedToken[] memory)
    {
        return synthesizedTokens[tokenId];
    }

    function recordSynthesized(
        address owner,
        address token,
        uint256 tokenId,
        uint256 subId
    ) internal virtual {
        synthesizedTokens[tokenId].push(
            SyntheticData.SynthesizedToken(token, owner, subId)
        );
    }

    function tokenAttributes(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        bytes memory data = "";
        uint256 id = primaryAttributeOf(tokenId);
        if (id > 0) {
            data = abi.encodePacked(
                '{"trait_type":"',
                symbol(id),
                '","value":"',
                textOf(tokenId, id),
                '"}'
            );
        }
        uint256[] memory attrs = attributesOf(tokenId);
        for (uint256 i = 0; i < attrs.length; i++) {
            if (data.length > 0) {
                data = abi.encodePacked(data, ",");
            }
            data = abi.encodePacked(
                data,
                '{"trait_type":"',
                symbol(attrs[i]),
                '","value":"',
                textOf(tokenId, attrs[i]),
                '"}'
            );
        }
        data = abi.encodePacked(data, getSubAttributes(tokenId));

        return string(data);
    }

    function getSubAttributes(uint256 tokenId)
        public
        view
        returns (bytes memory)
    {
        bytes memory data = "";
        SyntheticData.SynthesizedToken[] storage sTokens = synthesizedTokens[
            tokenId
        ];
        for (uint256 i = 0; i < sTokens.length; i++) {
            if (data.length > 0) {
                data = abi.encodePacked(data, ",");
            }
            data = abi.encodePacked(data, tokenAttributes(sTokens[i].id));
        }
        return data;
    }

    function setComponents(string memory name, address _addr) public virtual {
        componentsAmount++;
        components[name] = _addr;
        componentsName[componentsAmount] = name;
    }
}
