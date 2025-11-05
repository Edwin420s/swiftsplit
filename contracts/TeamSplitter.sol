// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TeamSplitter is Ownable {
    IERC20 public usdcToken;
    
    struct Team {
        address owner;
        string name;
        address[] members;
        uint256[] shares;
        bool active;
    }
    
    mapping(bytes32 => Team) public teams;
    mapping(address => bytes32[]) public userTeams;
    
    event TeamCreated(bytes32 indexed teamId, address indexed owner, string name);
    event TeamUpdated(bytes32 indexed teamId);
    event TeamPaymentExecuted(
        bytes32 indexed teamId,
        bytes32 paymentId,
        uint256 totalAmount
    );

    constructor(address _usdcAddress) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
    }

    function createTeam(
        string memory _name,
        address[] memory _members,
        uint256[] memory _shares
    ) external returns (bytes32) {
        require(_members.length > 0, "No team members specified");
        require(_members.length == _shares.length, "Members and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_members[i] != address(0), "Invalid member address");
            require(_shares[i] > 0, "Share must be greater than 0");
            totalShares += _shares[i];
        }
        
        require(totalShares == 10000, "Total shares must equal 10000 (100%)");
        
        bytes32 teamId = keccak256(abi.encodePacked(
            msg.sender,
            _name,
            block.timestamp
        ));
        
        teams[teamId] = Team({
            owner: msg.sender,
            name: _name,
            members: _members,
            shares: _shares,
            active: true
        });
        
        for (uint256 i = 0; i < _members.length; i++) {
            userTeams[_members[i]].push(teamId);
        }
        
        emit TeamCreated(teamId, msg.sender, _name);
        
        return teamId;
    }

    function executeTeamPayment(
        bytes32 _teamId,
        uint256 _totalAmount,
        string memory _invoiceId
    ) external returns (bytes32) {
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        require(team.active, "Team is not active");
        require(_totalAmount > 0, "Amount must be greater than 0");
        
        require(usdcToken.balanceOf(msg.sender) >= _totalAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= _totalAmount, "Insufficient allowance");
        
        uint256[] memory amounts = new uint256[](team.members.length);
        for (uint256 i = 0; i < team.members.length; i++) {
            amounts[i] = (_totalAmount * team.shares[i]) / 10000;
        }
        
        for (uint256 i = 0; i < team.members.length; i++) {
            bool success = usdcToken.transferFrom(
                msg.sender,
                team.members[i],
                amounts[i]
            );
            require(success, "USDC transfer failed");
        }
        
        bytes32 paymentId = keccak256(abi.encodePacked(
            _teamId,
            _invoiceId,
            block.timestamp
        ));
        
        emit TeamPaymentExecuted(_teamId, paymentId, _totalAmount);
        
        return paymentId;
    }

    function updateTeam(
        bytes32 _teamId,
        address[] memory _members,
        uint256[] memory _shares
    ) external {
        Team storage team = teams[_teamId];
        require(team.owner == msg.sender, "Only team owner can update");
        require(_members.length == _shares.length, "Members and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_members[i] != address(0), "Invalid member address");
            require(_shares[i] > 0, "Share must be greater than 0");
            totalShares += _shares[i];
        }
        
        require(totalShares == 10000, "Total shares must equal 10000 (100%)");
        
        team.members = _members;
        team.shares = _shares;
        
        emit TeamUpdated(_teamId);
    }

    function getTeam(bytes32 _teamId) external view returns (
        address owner,
        string memory name,
        address[] memory members,
        uint256[] memory shares,
        bool active
    ) {
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        
        return (
            team.owner,
            team.name,
            team.members,
            team.shares,
            team.active
        );
    }

    function getUserTeams(address _user) external view returns (bytes32[] memory) {
        return userTeams[_user];
    }
}