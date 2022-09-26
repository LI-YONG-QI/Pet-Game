// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract ReceiverContract is Ownable, AccessControl {
    event Deposit(address sender, uint256 amount, uint256 balance);
    event TransferRoyalties(address sender, uint256 value, address receiver);

    bytes32 public constant ADMIN = keccak256("Admin");
    bytes32 public constant MEMBER = keccak256("Member");

    mapping(uint256 => address) memberIdToAddress;
    mapping(address => uint256) memberAddressToId;
    mapping(uint256 => uint256) memberRoyalties;

    uint256 public currentMemberId = 0;

    constructor(address publisher, uint256 royalties) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MEMBER, msg.sender);
        _setupRole(ADMIN, msg.sender);
        _setRoleAdmin(MEMBER, ADMIN);

        addMember(publisher, royalties);
        _grantRole(MEMBER, publisher);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function memberExists(uint256 _memberId) public view returns (bool) {
        return (memberIdToAddress[_memberId] != address(0));
    }

    function addMember(address _member, uint256 royalties)
        public
        onlyRole(getRoleAdmin(ADMIN))
    {
        memberIdToAddress[currentMemberId] = _member;
        memberAddressToId[msg.sender] = currentMemberId;
        memberRoyalties[currentMemberId] = royalties;

        _grantRole(MEMBER, _member);
        currentMemberId++;
    }

    function getMemberAddress(uint256 _memberId) public view returns (address) {
        require(memberExists(_memberId), "The member is not exist");
        return memberIdToAddress[_memberId];
    }

    function getMemberID(address user) public view returns (uint256) {
        uint256 memberId = memberAddressToId[user];
        require(memberExists(memberId), "The member is not exist");
        return memberId;
    }

    function getMemberRoyalties(uint256 _memberId)
        public
        view
        returns (uint256)
    {
        require(memberExists(_memberId), "The member is not exist");
        return memberRoyalties[_memberId];
    }

    function processRoyalties() public onlyRole(ADMIN) {
        uint256 balance = (address(this).balance);
        for (uint i = 0; i < currentMemberId; i++) {
            uint256 _value = (balance * getMemberRoyalties(i)) / 10000;
            (bool success, ) = getMemberAddress(i).call{value: _value}("");
            require(success, "Failed to send Ether");
            //emit TransferRoyalties(msg.sender, _value, getMemberAddress(i));
        }
    }
}
