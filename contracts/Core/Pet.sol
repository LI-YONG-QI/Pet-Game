// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import {ERC3664CrossSynthetic} from "../ERC3664/Synthetic/ERC3664CrossSynthetic.sol";
import "../ERC3664/extensions/ERC3664Upgradable.sol";

import {IComponentBase} from "../Component/IComponentBase.sol";
import "../ERC2981/ERC2981ContractWideRoyalties.sol";

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import {IGovernance} from "../Governance/IGovernance.sol";

import {PetData} from "../libraries/PetData.sol";
import {SyntheticLogic} from "../libraries/SyntheticLogic.sol";

contract Pet is
    ERC721Enumerable,
    ERC3664Upgradable,
    ERC3664CrossSynthetic,
    Ownable,
    AccessControlEnumerable,
    ERC2981ContractWideRoyalties,
    VRFConsumerBaseV2
{
    using Strings for uint256;

    event RequestedRandomness(uint256 reqId, address invoker);
    event ReceivedRandomness();
    event SetTokenURI(address from, uint256 tokenId, string _uri);
    event Deposit(address sender, uint256 amount, uint256 balance);
    event ChangeChainlinkParams(
        bytes32 keyHash,
        uint64 subId,
        uint16 reqConfirm,
        uint32 gasLimit
    );

    // Store URI of tokenId
    mapping(uint256 => string) tokenIdToURI;

    // The nexxt tokenID to mint
    uint256 private _currentIndex = 0;

    string public baseURI;
    bool public isSalesActive = false;

    //The total Supply of token quantity
    uint32 public constant SUPPLY = 30;

    //The address of governance contract
    address public governance;

    //VRF info
    struct ChainlinkParams {
        bytes32 keyHash;
        uint64 subId;
        uint16 requestConfirms;
        uint32 gasLimit;
    }
    VRFCoordinatorV2Interface public immutable COORDINATOR;
    ChainlinkParams public chainlinkParams;

    //Number of Characteristic
    uint8 public constant CHARA_AMOUNT = 5;

    //Set of characteristic
    string[5] public characteristicTexts = [
        "Lazy",
        "Brave",
        "Lonely",
        "Relaxed",
        "Lax"
    ];

    //Store choosed characteristic text
    mapping(uint256 => string) choosedCharacteristicText;

    //Random offset of characteristic text index
    uint256 private _offset = 0;

    constructor(
        uint256[] memory attrIds,
        string[] memory names,
        string[] memory symbols,
        string[] memory uris,
        string memory attrBaseURI,
        address _vrfCoordinator, // Chainlink VRF coordinator address
        ChainlinkParams memory _chainlinkParams
    )
        ERC721("Pet", "PET")
        ERC3664(attrBaseURI)
        VRFConsumerBaseV2(_vrfCoordinator)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PetData.GOVERNORS, _msgSender());
        _setupRole(PetData.URI_SETTER, _msgSender());

        _mintBatch(attrIds, names, symbols, uris);
        mintWithLevel(PetData.Level, "LEVEL", "level", "", 10);

        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        chainlinkParams = _chainlinkParams;
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
    ) public virtual onlyOwner {
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

    function mint() external payable {
        require(isSalesActive, "Not yet");
        require(_currentIndex <= SUPPLY, "Exceed purchased");
        require(msg.value >= 0.005 ether, "no enough eth to mint");
        _safeMint(msg.sender, _currentIndex);
        _afterTokenMint(_currentIndex);
        _currentIndex++;
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

    function separateOne(
        uint256 tokenId,
        uint256 subId,
        address subAddress,
        string memory _uri
    ) public onlyRole(PetData.URI_SETTER) {
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
        attachWithText(tokenId, PetData.Species, 1, bytes("Monkey"));

        uint256 _idx = (tokenId + _offset) % CHARA_AMOUNT;
        attachWithText(
            tokenId,
            PetData.Characteristic,
            1,
            bytes(characteristicTexts[_idx])
        );

        setPrimaryAttribute(tokenId, PetData.PET_NFT);

        for (uint256 i = 1; i <= componentsAmount; i++) {
            string memory name = componentsName[i];
            address componentAddr = components[name];
            //uint256 subId = IComponentBase(componentAddr).getCurrentTokenId();
            IComponentBase(componentAddr).defaultMint();
            IComponentBase(componentAddr).recordSubTokens(
                tokenId,
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
        //requestRandomWords();
    }

    function _setTokenURI(uint256 tokenId, string memory uri) private {
        tokenIdToURI[tokenId] = uri;
        emit SetTokenURI(msg.sender, tokenId, uri);
    }

    function setChainlinkParams(ChainlinkParams memory _chainlinkParams)
        external
        onlyOwner
    {
        chainlinkParams = _chainlinkParams;
        emit ChangeChainlinkParams(
            chainlinkParams.keyHash,
            chainlinkParams.subId,
            chainlinkParams.requestConfirms,
            chainlinkParams.gasLimit
        );
    }

    function setGovernance(address newAddr)
        external
        onlyRole(PetData.GOVERNORS)
    {
        governance = newAddr;
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

    function requestRandomWords() public {
        require(_offset == 0, "Requseted!");
        uint256 reqId = COORDINATOR.requestRandomWords(
            chainlinkParams.keyHash,
            chainlinkParams.subId,
            chainlinkParams.requestConfirms,
            chainlinkParams.gasLimit,
            1
        );
        emit RequestedRandomness(reqId, msg.sender);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        _offset = randomWords[0] % SUPPLY;
        emit ReceivedRandomness();
    }
}
