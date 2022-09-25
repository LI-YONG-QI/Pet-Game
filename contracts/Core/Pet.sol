// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../ERC3664/Synthetic/ERC3664CrossSynthetic.sol";
import "../ERC3664/extensions/ERC3664Upgradable.sol";
import "../ERC3664/extensions/ERC3664Updatable.sol";
import "../ERC3664/presets/ERC3664Generic.sol";
import "../ERC3664/utils/StringsUtil.sol";
import "../Component/IComponentBase.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../ERC2981/ERC2981ContracWideRoyalties.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import {PetData} from "../libraries/PetData.sol";
import {SyntheticLogic} from "../libraries/SyntheticLogic.sol";

contract Pet is
    ERC721Enumerable,
    ERC3664Upgradable,
    ERC3664CrossSynthetic,
    ERC3664Updatable,
    Ownable,
    AccessControlEnumerable,
    ERC2981ContractWideRoyalties
{
    using Strings for uint256;
    using StringsUtil for string;

    event SetTokenURI(address from, uint256 tokenId, string _uri);
    event Deposit(address sender, uint256 amount, uint256 balance);

    mapping(uint256 => string) tokenIdToURI;

    string public baseURI;
    bool public isSalesActive = false;
    uint256 public constant Supply = 8000;

    //address public GovernanceContract;

    constructor(
        uint256[] memory attrIds,
        string[] memory names,
        string[] memory symbols,
        string[] memory uris,
        string memory attrBaseURI
    ) ERC721("Pet", "PET") ERC3664(attrBaseURI) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PetData.MINTER_ROLE, _msgSender());
        _setupRole(PetData.URI_SETTER, _msgSender());

        _mintBatch(attrIds, names, symbols, uris);
        mintWithLevel(PetData.Level, "LEVEL", "level", "", 10);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function mintBatch(
        uint256[] calldata attrIds,
        string[] calldata names,
        string[] calldata symbols,
        string[] calldata uris
    ) public virtual {
        require(
            hasRole(PetData.MINTER_ROLE, _msgSender()),
            "ERC3664Generic: must have minter role to mint"
        );

        _mintBatch(attrIds, names, symbols, uris);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(
            ERC3664,
            ERC721Enumerable,
            ERC2981Base,
            AccessControlEnumerable
        )
        returns (bool)
    {
        return
            // interfaceId == type(ISynthetic).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function setRoyalties(address recipient, uint256 value) external onlyOwner {
        _setRoyalties(recipient, value);
    }

    function mint(uint256 tokenId) external payable {
        require(isSalesActive, "Not yet");
        require(tokenId <= Supply, "Exceed purchased");
        require(msg.value >= 0.005 ether, "no enough eth to mint");
        _safeMint(msg.sender, tokenId);
        _afterTokenMint(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory _uri)
        public
        onlyRole(PetData.URI_SETTER)
    {
        tokenIdToURI[tokenId] = _uri;
        emit SetTokenURI(msg.sender, tokenId, _uri);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (bytes(tokenIdToURI[tokenId]).length > 0) {
            return tokenIdToURI[tokenId];
        } else {
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
    }

    function combine(
        uint256 tokenId,
        uint256[] calldata subIds,
        address[] calldata subAddress,
        string memory _uri
    ) public onlyRole(PetData.URI_SETTER) {
        require(
            primaryAttributeOf(tokenId) == PetData.PET_NFT,
            "only support primary token been combine"
        );
        bytes memory primaryAttrText = textOf(tokenId, PetData.PET_NFT);
        SyntheticLogic.combine(
            tokenId,
            subIds,
            subAddress,
            primaryAttrText,
            synthesizedTokens
        );
        _setTokenURI(tokenId, _uri);
    }

    function separate(uint256 tokenId, string memory _uri) public {
        // require(
        //     _isApprovedOrOwner(_msgSender(), tokenId),
        //     "caller is not token owner nor approved"
        // );
        // require(
        //     primaryAttributeOf(tokenId) == PET_NFT,
        //     "only support primary token separate"
        // );
        // SyntheticData.SynthesizedToken[] storage subs = synthesizedTokens[
        //     tokenId
        // ];
        // require(subs.length > 0, "not synthesized token");
        // for (uint256 i = 0; i < subs.length; i++) {
        //     _transfer(address(this), subs[i].owner, subs[i].id);
        // }
        // delete synthesizedTokens[tokenId];
        // _setTokenURI(tokenId, _uri);
    }

    function separateOne(
        uint256 tokenId,
        uint256 subId,
        address subAddress,
        string memory _uri
    ) public onlyRole(PetData.URI_SETTER) {
        // require(
        //     _isApprovedOrOwner(_msgSender(), tokenId),
        //     "caller is not token owner nor approved"
        // );
        require(
            primaryAttributeOf(tokenId) == PetData.PET_NFT,
            "only support primary token separate"
        );
        uint256 idx = SyntheticLogic.findByValue(
            synthesizedTokens[tokenId],
            subId,
            subAddress
        );
        SyntheticLogic.separateOne(tokenId, subId, idx, synthesizedTokens);
        _setTokenURI(tokenId, _uri);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        SyntheticLogic.setSubOwner(synthesizedTokens[tokenId], to);
    }

    function _afterTokenMint(uint256 tokenId) internal virtual {
        attachWithText(tokenId, PetData.PET_NFT, 1, bytes("pet"));
        attach(tokenId, 2, 1);

        //Need match with NFT metadata, "Monkey is a mock data"
        attachWithText(tokenId, 3, 1, bytes("Monkey"));
        attachWithText(tokenId, 4, 1, bytes("Lazy"));

        setPrimaryAttribute(tokenId, PetData.PET_NFT);

        for (uint256 i = 1; i <= componentsAmount; i++) {
            string memory name = componentsName[i];
            address componentAddr = components[name];
            uint256 subId = IComponentBase(componentAddr).getCurrentTokenId();
            IComponentBase(componentAddr).mint();
            IComponentBase(componentAddr).recordSubTokens(
                subId,
                address(this),
                tokenId
            );
            recordSynthesized(_msgSender(), components[name], tokenId, tokenId);
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI)
        public
        onlyRole(PetData.URI_SETTER)
    {
        baseURI = newURI;
    }

    function setIsActive(bool status, string memory newURI) public onlyOwner {
        isSalesActive = status;
        setBaseURI(newURI);
    }

    function _setTokenURI(uint256 tokenId, string memory uri) private {
        tokenIdToURI[tokenId] = uri;
        emit SetTokenURI(msg.sender, tokenId, uri);
    }

    function upgrade(
        uint256 _tokenId,
        uint256 _attrId,
        uint8 _level
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), _tokenId),
            "caller is not token owner nor approved"
        );
        super.upgrade(_tokenId, _attrId, _level);
    }

    function increase(
        uint256 tokenId,
        uint256 attrId,
        uint256 amount
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not token owner nor approved"
        );
        super.increase(tokenId, attrId, amount);
    }
}
