const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

require('chai')
  .use(require('chai-as-promised'))
  .should()

describe('Character contract test', () =>{
    const WEAPON = 8001;
    const ARMOR= 8002;
    const WEAPON_ONE = 8003;
    const ARMOR_ONE= 8004;

    const token = 0;
    const tokenOne = 1;

    const CHARACTER_NFT_NUMBER = 1;
    const WEAPON_NFT_NUMBER = 2;
    const ARMOR_NFT_NUMBER = 3; 

    const MINT_PRICE = '0.005';

    let owner
    let user

    let address
    let character

    describe("Basic function test", async () => {
        before(async () => {
            [owner, user] = await ethers.getSigners();
            const Character = await ethers.getContractFactory("Character")
            character = await Character.deploy()
            console.log(character.address)
            address = character.address

            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it("Check account init state", async () => {
            assert.equal(await character["balanceOf(address)"](user.address), 0);
            await character.ownerOf(token).should.be.rejected
        })

        it("Check contract init state", async () => {
            assert.equal(await character["name(uint256)"](CHARACTER_NFT_NUMBER), "CHARACTER"); 
            assert.equal(await character["symbol(uint256)"](CHARACTER_NFT_NUMBER), "character"); 
            assert.equal(await character["name(uint256)"](WEAPON_NFT_NUMBER), "WEAPON"); 
            assert.equal(await character["symbol(uint256)"](WEAPON_NFT_NUMBER), "weapon"); 
            assert.equal(await character["name(uint256)"](ARMOR_NFT_NUMBER), "ARMOR"); 
            assert.equal(await character["symbol(uint256)"](ARMOR_NFT_NUMBER), "armor"); 
        }) 

        it("Mint Token", async () => {
            await character.connect(user).mint(user.address, token ,{value: ethers.utils.parseEther(MINT_PRICE)})
            assert.equal(await character["balanceOf(address)"](user.address), 1);
            assert.equal(await character.ownerOf(token), user.address);
            assert.equal(await character.attributesOf(token), CHARACTER_NFT_NUMBER);
            assert.equal(await character.primaryAttributeOf(token), CHARACTER_NFT_NUMBER)
        })

        it("Get subToken of token", async () => {
            let synthesizedTokens = await character.getSubTokens(token);
            assert.equal(synthesizedTokens.length, 2);
            assert.equal(synthesizedTokens[0], WEAPON);
            assert.equal(synthesizedTokens[1], ARMOR);    
        })
    
        it("Separate weapon from token", async() => {
            await character.connect(user).separateOne(token, WEAPON)
            assert.equal(await character["balanceOf(address)"](user.address), 2);
            assert.equal(await character.ownerOf(WEAPON), user.address);
    
            //Check subToken of token 0
            let synthesizedTokens = await character.getSubTokens(token);
            assert.equal(synthesizedTokens.length, 1);
            assert.equal(synthesizedTokens[0], ARMOR);
        })
    
        it("Combine weapon with token", async() => {
            await character.connect(user).combine(token, [WEAPON]);
            assert.equal(await character["balanceOf(address)"](user.address), 1);
            assert.equal(await character.ownerOf(WEAPON), address);
        })
    })

    describe("Seperate and combine with another sub token", async () => {
        before(async () =>{
            [owner, user] = await ethers.getSigners();
            const Character = await ethers.getContractFactory("Character")
            character = await Character.deploy()
            console.log(character.address)
            address = character.address

            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it("State init", async () => {
            await character.connect(user).mint(user.address, token ,{value: ethers.utils.parseEther(MINT_PRICE)})
            await character.connect(owner).mint(owner.address, tokenOne ,{value: ethers.utils.parseEther(MINT_PRICE)})
            assert.equal(await character.ownerOf(token), user.address);
            assert.equal(await character.ownerOf(tokenOne), owner.address);
    
            let synthesizedTokens = await character.getSubTokens(token);
            assert.equal(synthesizedTokens.length, 2);
            assert.equal(synthesizedTokens[0], WEAPON);
            assert.equal(synthesizedTokens[1], ARMOR);    
    
            synthesizedTokens = await character.getSubTokens(tokenOne);
            assert.equal(synthesizedTokens.length, 2);
            assert.equal(synthesizedTokens[0], WEAPON_ONE);
            assert.equal(synthesizedTokens[1], ARMOR_ONE);   
        })

        it("Seperate weapon from the both", async()=>{
            //before seperate
            assert.equal(await character.ownerOf(WEAPON), address);
            assert.equal(await character.ownerOf(WEAPON_ONE), address);
    
            await character.connect(user).separateOne(token, WEAPON);
            await character.connect(owner).separateOne(tokenOne, WEAPON_ONE);
    
            //after seperate
            assert.equal(await character.ownerOf(WEAPON), user.address);
            assert.equal(await character.ownerOf(WEAPON_ONE), owner.address);
        })
    
        it("Transfer weapon token to account", async()=>{
            await character.connect(owner).transferFrom(user.address, owner.address, WEAPON).should.be.rejected;
            await character.connect(user).transferFrom(user.address, owner.address, WEAPON);
            await character.connect(owner).transferFrom(owner.address, user.address, WEAPON_ONE);
            
            assert.equal(await character.ownerOf(WEAPON), owner.address);
            assert.equal(await character.ownerOf(WEAPON_ONE), user.address);
            
        })
    
        it("Combine weapon with tokens", async()=>{
            await character.connect(user).combine(token, [WEAPON_ONE]);
            await character.connect(owner).combine(tokenOne, [WEAPON]);
    
            assert.equal(await character.ownerOf(WEAPON), address);
            assert.equal(await character.ownerOf(WEAPON_ONE), address);
        })
    
        it("Check synthesizedTokens", async()=>{
            let synthesizedTokens = await character.getSubTokens(token);
            assert.equal(synthesizedTokens.length, 2);
            assert.equal(synthesizedTokens[0], ARMOR);    
            assert.equal(synthesizedTokens[1], WEAPON_ONE);
    
            synthesizedTokens = await character.getSubTokens(tokenOne);
            assert.equal(synthesizedTokens.length, 2);
            assert.equal(synthesizedTokens[0], ARMOR_ONE);   
            assert.equal(synthesizedTokens[1], WEAPON);
        })
    })

    describe("Dynamic generate metadata json", async () => {
        before(async () => {
            [owner, user] = await ethers.getSigners();
            const Character = await ethers.getContractFactory("Character")
            character = await Character.deploy()
            console.log(character.address)
            address = character.address

            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)

            await character.connect(user).mint(user.address, token ,{value: ethers.utils.parseEther(MINT_PRICE)})
            await character.connect(owner).mint(owner.address, tokenOne ,{value: ethers.utils.parseEther(MINT_PRICE)})
        })

        it("Get token URI", async () => {
            let URI = await character.tokenURI(token);
            console.log("token init URI")
            console.log(URI)
    
            await character.connect(user).separateOne(token, WEAPON);
            await character.connect(owner).separateOne(tokenOne, WEAPON_ONE)
    
            URI = await character.tokenURI(token);
            console.log("token URI after separate")
            console.log(URI)
        })
    
        it("Change weapon with token", async () => {
            await character.connect(user).transferFrom(user.address, owner.address, WEAPON);
            await character.connect(owner).transferFrom(owner.address, user.address, WEAPON_ONE);
    
            await character.connect(user).combine(token, [WEAPON_ONE]);
            await character.connect(owner).combine(tokenOne, [WEAPON]);
    
            console.log("token combine WEAPON_ONE")
            console.log(await character.tokenURI(token))
    
            console.log("tokenOne combine WEAPON")
            console.log(await character.tokenURI(tokenOne))
        })
    
        it("Separate all subtoken from token", async() => {
            await character.connect(user).mint(user.address, 2 ,{value: ethers.utils.parseEther(MINT_PRICE)})
            await character.connect(user).separate(2);
            console.log(await character.tokenURI(2));
        })
    })
    
})