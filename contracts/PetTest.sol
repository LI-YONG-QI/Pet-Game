// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC3664/Synthetic/ERC3664CrossSynthetic.sol";
import "./ERC3664/extensions/ERC3664Upgradable.sol";
import "./ERC3664/extensions/ERC3664Updatable.sol";
import "./ERC3664/presets/ERC3664Generic.sol";
import "./ERC3664/utils/StringsUtil.sol";
import "./Component/IComponentBase.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC2981/ERC2981ContracWideRoyalties.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract PetTest is
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

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ATTACH_ROLE = keccak256("ATTACH_ROLE");
    bytes32 public constant URI_SETTER = keccak256("ATTACH_ROLE");

    uint256 public constant IMMUTABLE_ATTRIBUTE = 5;

    // immutable attributes
    uint256 public constant PET_NFT = 1;

    // variable attributes
    uint256 public constant Level = 7;
    uint256 public constant Species = 8;
    uint256 public constant Characteristic = 9;

    mapping(uint256 => string) tokenIdToURI;
    mapping(string => address) component;

    string private baseURI =
        "https://ipfs.io/ipfs/QmVxhYesuZHBqJPa3ZNRVBxJW53kLJS1KiuLfWfd5HQGvS/";
    string private attrBaseURI =
        "https://ipfs.io/ipfs/QmSUEKehEASqjd5UAy5pJpnLSfh47zArmNATHA1SPLHhMV/";
    string public constant extension = ".json";

    bool public isSalesActive;
    uint256 public constant Supply = 8000;

    constructor(
        uint256[] memory attrIds,
        string[] memory names,
        string[] memory symbols,
        string[] memory uris
    ) ERC721("Pet", "PET") ERC3664(attrBaseURI) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(ATTACH_ROLE, _msgSender());
        _setupRole(URI_SETTER, _msgSender());

        _mintBatch(attrIds, names, symbols, uris);

        mintWithLevel(Level, "LEVEL", "level", "", 10);
        isSalesActive = true;
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
            hasRole(MINTER_ROLE, _msgSender()),
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
        onlyRole(URI_SETTER)
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
                            extension
                        )
                    )
                    : "";
        }
    }

    function separate(uint256 tokenId, string memory _uri) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not token owner nor approved"
        );
        require(
            primaryAttributeOf(tokenId) == PET_NFT,
            "only support primary token separate"
        );

        SynthesizedToken[] storage subs = synthesizedTokens[tokenId];
        require(subs.length > 0, "not synthesized token");
        for (uint256 i = 0; i < subs.length; i++) {
            _transfer(address(this), subs[i].owner, subs[i].id);
        }
        delete synthesizedTokens[tokenId];
        _setTokenURI(tokenId, _uri);
    }

    function separateOne(
        uint256 tokenId,
        uint256 subId,
        string memory _uri,
        address _address
    ) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not token owner nor approved"
        );
        require(
            primaryAttributeOf(tokenId) == PET_NFT,
            "only support primary token separate"
        );

        uint256 idx = findByValue(synthesizedTokens[tokenId], subId);
        SynthesizedToken storage token = synthesizedTokens[tokenId][idx];
        IComponentBase(component["Hat"]).transferFrom(
            _address,
            token.owner,
            token.id
        );

        removeAtIndex(synthesizedTokens[tokenId], idx);
        _setTokenURI(tokenId, _uri);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (primaryAttributeOf(tokenId) == PET_NFT) {
            SynthesizedToken[] storage subs = synthesizedTokens[tokenId];
            for (uint256 i = 0; i < subs.length; i++) {
                subs[i].owner = to;
            }
        }
    }

    function _afterTokenMint(uint256 tokenId) internal virtual {
        attachWithText(tokenId, PET_NFT, 1, bytes("pet"));
        attach(tokenId, Level, 1);

        //Need match with NFT metadata, "Monkey is a mock data"
        attachWithText(tokenId, Species, 1, bytes("Monkey"));
        attachWithText(tokenId, Characteristic, 1, bytes("Lazy"));

        setPrimaryAttribute(tokenId, PET_NFT);
        //uint256 id = Supply + tokenId * IMMUTABLE_ATTRIBUTE;

        IComponentBase(component["Hat"]).mint(tokenId, 0);
        IComponentBase(component["Hand"]).mint(tokenId, 0);
        recordSynthesized(_msgSender(), component["Hat"], tokenId, 0);
        recordSynthesized(_msgSender(), component["Hand"], tokenId, 0);
    }

    function setComponent(string memory name, address _addr) public onlyOwner {
        component[name] = _addr;
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

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI) public onlyOwner {
        baseURI = newURI;
    }

    function setIsActive(bool status) public onlyOwner {
        isSalesActive = status;
    }

    function _setTokenURI(uint256 tokenId, string memory uri) private {
        tokenIdToURI[tokenId] = uri;
        emit SetTokenURI(msg.sender, tokenId, uri);
    }
}
