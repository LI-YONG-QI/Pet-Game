// immutable attributes
const PET_NFT = 1;

// variable attributes
const Level = 2;
const Species = 3;
const Characteristic = 4;

const attrIds = [PET_NFT, Species, Characteristic];

const names = ["PET", "SPECIES", "CHARACTERISTIC"];
const symbols = ["pet", "species", "characteristic"];
const uris = ["", "", ""];

const tokenId = 0;
const _tokenId = 1;

const hatTokenId = 0;
const _hatTokenId = 1;

const hatBaseURI = "https://ipfs.io/ipfs/HatCID/";
const baseURI = "https://ipfs.io/ipfs/PetCID/";
const attrBaseURI = "https://ipfs.io/ipfs/AttrCID/";
const tokenURI = "https://ipfs.io/ipfs/PetCID/0.json";
const _tokenURI = "https://ipfs.io/ipfs/PetCID/1.json";
const updateTokenURI = "https://ipfs.io/ipfs/UpdateCID/";

const emptyAddress = "0x0000000000000000000000000000000000000000";
const mockVrfAddress = "0x0000000000000000000000000000000000000001";

const MINT_PRICE = "0.005";
const SLAES_PRICE = 10000;
const RATIO = 1000; //2.5%

const _chainlinkParams = {
  keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
  subId: 1,
  requestConfirms: 3,
  gasLimit: 1000000,
};

module.exports = {
  attrIds,
  names,
  symbols,
  uris,
  PET_NFT,
  Level,
  Species,
  Characteristic,
  attrBaseURI,
  baseURI,
  tokenId,
  tokenURI,
  _tokenId,
  _tokenURI,
  hatTokenId,
  hatBaseURI,
  _hatTokenId,
  MINT_PRICE,
  emptyAddress,
  updateTokenURI,
  RATIO,
  SLAES_PRICE,
  _chainlinkParams,
  mockVrfAddress,
};
