// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract ReceiverContract is Ownable {
    event Deposit(address sender, uint256 amount, uint256 balance);
    event Royalties(address sender, address publisher, address member);

    mapping(uint256 => address) memberShip;
    uint256 public currentMemberId = 0;

    constructor(address publisher) {
        addMember(publisher);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function memberExists(uint256 _memberId) public view returns (bool) {
        return (memberShip[_memberId] != address(0));
    }

    function addMember(address _member) public onlyOwner {
        memberShip[currentMemberId] = _member;
        currentMemberId++;
        currentMemberId++;
    }

    function getMemberAddress(uint256 _memberId) public view returns (address) {
        require(memberExists(_memberId), "The member is not exist");
        return memberShip[_memberId];
    }

    function processRoyalties(
        uint256 _memberId,
        uint256 memberAmount,
        uint256 publisherAmount,
        uint256 value //add ...
    ) public payable onlyOwner {
        require(memberExists(_memberId), "The member is not exist");

        //sent value to publisher
        (bool sentToPublisher, ) = payable(memberShip[0]).call{
            value: (value * publisherAmount) / 10000
        }("");

        //sent value to member
        (bool sentToMember, ) = memberShip[_memberId].call{
            value: (value * memberAmount) / 10000
        }("");

        require(sentToPublisher, "Publisher:Failed to send Ether");
        require(sentToMember, "Member:Failed to send Ether");

        emit Royalties(msg.sender, memberShip[0], memberShip[_memberId]);
    }
}
