// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SyntheticData} from "../ERC3664/utils/SyntheticData.sol";
import {PetData} from "./PetData.sol";
import {IComponentBase} from "../Component/IComponentBase.sol";

library SyntheticLogic {
    function combine(
        uint256 tokenId,
        uint256[] calldata subIds,
        address[] calldata subAddress,
        bytes memory primaryAttrText,
        mapping(uint256 => SyntheticData.SynthesizedToken[])
            storage synthesizedTokens
    ) public {
        for (uint256 i = 0; i < subIds.length; i++) {
            // require(
            //     IComponentBase(subAddress[i]).ownerOf(subIds[i]) == msg.sender,
            //     "caller is not sub token owner"
            // );
            uint256 nft_attr = IComponentBase(subAddress[i]).primaryAttributeOf(
                subIds[i]
            );
            bytes memory text = IComponentBase(subAddress[i]).textOf(
                subIds[i],
                nft_attr
            );
            address owner = IComponentBase(subAddress[i]).ownerOf(subIds[i]);
            require(
                keccak256(text) != keccak256(primaryAttrText),
                "not support combine between primary token"
            );
            for (uint256 j = 0; j < synthesizedTokens[tokenId].length; j++) {
                uint256 id = synthesizedTokens[tokenId][j].id;
                address token = synthesizedTokens[tokenId][j].token;

                bytes memory _text = IComponentBase(token).textOf(id, nft_attr);

                require(
                    keccak256(text) != keccak256(_text),
                    "duplicate sub token type"
                );
            }
            IComponentBase(subAddress[i]).transferFrom(
                owner,
                address(this),
                subIds[i]
            );

            synthesizedTokens[tokenId].push(
                SyntheticData.SynthesizedToken(
                    subAddress[i],
                    msg.sender,
                    subIds[i]
                )
            );
        }
    }

    // function separate(uint256 tokenId, string memory _uri) public {
    //     require(
    //         _isApprovedOrOwner(_msgSender(), tokenId),
    //         "caller is not token owner nor approved"
    //     );
    //     require(
    //         primaryAttributeOf(tokenId) == PET_NFT,
    //         "only support primary token separate"
    //     );
    //     SynthesizedToken[] storage subs = synthesizedTokens[tokenId];
    //     require(subs.length > 0, "not synthesized token");
    //     for (uint256 i = 0; i < subs.length; i++) {
    //         _transfer(address(this), subs[i].owner, subs[i].id);
    //     }
    //     delete synthesizedTokens[tokenId];
    //     _setTokenURI(tokenId, _uri);
    // }

    function separateOne(
        uint256 tokenId,
        uint256 subId,
        uint256 idx,
        mapping(uint256 => SyntheticData.SynthesizedToken[])
            storage synthesizedTokens
    ) public {
        address owner = synthesizedTokens[tokenId][idx].owner;
        address token = synthesizedTokens[tokenId][idx].token;
        IComponentBase(token).transferFrom(address(this), owner, subId);
        removeAtIndex(synthesizedTokens[tokenId], idx);
    }

    function findByValue(
        SyntheticData.SynthesizedToken[] storage values,
        uint256 value,
        address _addr
    ) internal view returns (uint256) {
        uint256 i = 0;
        while (values[i].id != value || values[i].token != _addr) {
            i++;
        }
        return i;
    }

    function removeAtIndex(
        SyntheticData.SynthesizedToken[] storage values,
        uint256 index
    ) internal {
        uint256 max = values.length;
        if (index >= max) return;

        if (index == max - 1) {
            values.pop();
            return;
        }

        for (uint256 i = index; i < max - 1; i++) {
            values[i] = values[i + 1];
        }
        values.pop();
    }

    function setSubOwner(
        SyntheticData.SynthesizedToken[] storage values,
        address to
    ) internal {
        for (uint256 i = 0; i < values.length; i++) {
            values[i].owner = to;
        }
    }
}
