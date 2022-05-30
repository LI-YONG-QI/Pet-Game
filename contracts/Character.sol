// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC3664/Synthetic/ERC3664Synthetic.sol";
import "./ERC3664/utils/StringsUtil.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC3664/utils/Base64.sol";
import "./CharacterData.sol";

contract Character is  ERC721Enumerable,ERC3664Synthetic, Ownable, CharacterData{
    using Strings for uint256;
    using StringsUtil for string;

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

    uint256 public constant CHARACTER_NFT_NUMBER = 1;
    uint256 public constant WEAPON_NFT_NUMBER = 2;
    uint256 public constant ARMOR_NFT_NUMBER = 3; 


    string private _name = "Character";
    string private _symbol = "CHR";

    string private baseURI = "https://gateway.pinata.cloud/ipfs/QmeNiKJtx9LwwYsAmbkTD4jg7pcghdxyV8QnwQiumevww7/";

    bool private _isSalesActive;
    uint256 public constant Supply = 8000;

    constructor() ERC721("Character", "CHR") ERC3664("") {
        _mint(CHARACTER_NFT_NUMBER, "CHARACTER", "character", "");
        _mint(WEAPON_NFT_NUMBER, "WEAPON", "weapon", ""); 
        _mint(ARMOR_NFT_NUMBER, "ARMOR", "armor", "");
        _isSalesActive = true;
    }

    function mint(address to, uint256 tokenId) external payable {
        require(_isSalesActive, "Not yet");
        require(tokenId <= Supply, "Exceed purchased");
        require(msg.value >= 0.005 ether, "no enough eth to mint");

        _safeMint(to, tokenId);
        _afterTokenMint(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory)
    {
        string[4] memory parts;

        parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">';

        parts[1] = '<circle cx="100" cy="100" r="40" stroke="green" stroke-width="4" fill="red" />';

        parts[2] = tokenImage(tokenId);

        parts[3] = '</svg>';

        // build tokenURI from randomNumber
        string memory TokenURI = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3]));
        
        // metadata
        string memory name = string(abi.encodePacked("token #", tokenId.toString()));
        string memory description = "A dynamic NFT";

        // prettier-ignore
        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        abi.encodePacked('{"name":"', name, '", "description":"', description, '", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(TokenURI)), '"}')
                    )
                )
            )
        );
    }

    function tokenImage(uint256 tokenId) public view returns(string memory){
        SynthesizedToken[] storage tokens = synthesizedTokens[tokenId];
        // require(tokens.length > 0, 'It is invalid');
        string memory image = "";
        for(uint256 i = 0; i < tokens.length; i++) {
            image = image.concat(getSubTokenXml(tokens[i].id));
        }
        return image;
    }

    function getSubTokenXml(uint256 tokenId) public view returns(string memory){
        uint256 nft_id = primaryAttributeOf(tokenId);
        require(nft_id != 0 && nft_id != 1, "Can't get token xml");

        if(nft_id == WEAPON_NFT_NUMBER){
            return (getWeapon(tokenId));
        }else if (nft_id == ARMOR_NFT_NUMBER){
            return ('<ellipse cx="100" cy="130" rx="100" ry="20" style="fill:yellow;"/>');
        }

        return "";
    }

    function getWeapon(uint256 tokenId) internal view returns(string memory){
        string memory weapon = "";
        string memory weaponBase = '<rect x="50" y="50" width="100" height="30" fill="';
        if(tokenId % 8000 == 1){
            weapon = weaponBase.concat(color[0]);
        }else{
            weapon = weaponBase.concat(color[1]);
        }
        weapon = weapon.concat('" opacity="0.3"/>');
        return weapon;
    }

    function getSubTokens(uint256 tokenId)
        public
        view
        returns (uint256[] memory)
    {
        SynthesizedToken[] storage tokens = synthesizedTokens[tokenId];
        uint256[] memory subs = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            subs[i] = tokens[i].id;
        }
        return subs;
    }

    function combine(uint256 tokenId, uint256[] calldata subIds) public {
        require(ownerOf(tokenId) == _msgSender(), "caller is not token owner");
        require(
            primaryAttributeOf(tokenId) == CHARACTER_NFT_NUMBER,
            "only support primary token been combine"
        );

        for (uint256 i = 0; i < subIds.length; i++) {
            require(
                ownerOf(subIds[i]) == _msgSender(),
                "caller is not sub token owner"
            );
            uint256 nft_attr = primaryAttributeOf(subIds[i]);
            require(
                nft_attr != CHARACTER_NFT_NUMBER,
                "not support combine between primary token"
            );
            for (uint256 j = 0; j < synthesizedTokens[tokenId].length; j++) {
                uint256 id = synthesizedTokens[tokenId][j].id;
                require(
                    nft_attr != primaryAttributeOf(id),
                    "duplicate sub token type"
                );
            }

            _transfer(_msgSender(), address(this), subIds[i]);
            synthesizedTokens[tokenId].push(
                SynthesizedToken(_msgSender(), subIds[i])
            );
        }
    }

    function separate(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not token owner nor approved"
        );
        require(
            primaryAttributeOf(tokenId) == CHARACTER_NFT_NUMBER,
            "only support primary token separate"
        );

        SynthesizedToken[] storage subs = synthesizedTokens[tokenId];
        require(subs.length > 0, "not synthesized token");
        for (uint256 i = 0; i < subs.length; i++) {
            _transfer(address(this), subs[i].owner, subs[i].id);
        }
        delete synthesizedTokens[tokenId];
    }

    function separateOne(uint256 tokenId, uint256 subId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not token owner nor approved"
        );
        require(
            primaryAttributeOf(tokenId) == CHARACTER_NFT_NUMBER,
            "only support primary token separate"
        );

        uint256 idx = findByValue(synthesizedTokens[tokenId], subId);
        SynthesizedToken storage token = synthesizedTokens[tokenId][idx];
        _transfer(address(this), token.owner, token.id);
        removeAtIndex(synthesizedTokens[tokenId], idx);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (primaryAttributeOf(tokenId) == CHARACTER_NFT_NUMBER) {
            SynthesizedToken[] storage subs = synthesizedTokens[tokenId];
            for (uint256 i = 0; i < subs.length; i++) {
                subs[i].owner = to;
            }
        }
    }

    function _afterTokenMint(uint256 tokenId) internal virtual {
        attachWithText(tokenId, CHARACTER_NFT_NUMBER, 1, bytes("character"));
        setPrimaryAttribute(tokenId, CHARACTER_NFT_NUMBER);
        uint256 id = Supply + tokenId * 2;

        // WEAPON
        mintSubToken(WEAPON_NFT_NUMBER, tokenId, id + 1);

        // ARMOR
        mintSubToken(ARMOR_NFT_NUMBER, tokenId, id + 2);
    }

    function mintSubToken(
        uint256 attr,
        uint256 tokenId,
        uint256 subId
    ) internal virtual {
        _mint(address(this), subId);
        attachWithText(subId, attr, 1, bytes(""));
        setPrimaryAttribute(subId, attr);
        recordSynthesized(_msgSender(), tokenId, subId);
    }

    function findByValue(SynthesizedToken[] storage values, uint256 value)
        internal
        view
        returns (uint256)
    {
        uint256 i = 0;
        while (values[i].id != value) {
            i++;
        }
        return i;
    }

    function removeAtIndex(SynthesizedToken[] storage values, uint256 index)
        internal
    {
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
}
