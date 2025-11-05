// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TeamSplitter is Ownable, ReentrancyGuard, Pausable {
    IERC20 public usdcToken;
    uint256 public maxTeamPaymentAmount;
    
    struct Team {
        address owner;
        string name;
        address[] members;
        uint256[] shares;
        bool active;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Team) public teams;
    mapping(address => bytes32[]) public userTeams;
    mapping(address => bool) public authorizedControllers;
    
    event TeamCreated(bytes32 indexed teamId, address indexed owner, string name);
    event TeamUpdated(bytes32 indexed teamId);
    event TeamDeactivated(bytes32 indexed teamId);
    event TeamPaymentExecuted(
        bytes32 indexed teamId,
        bytes32 paymentId,
        uint256 totalAmount
    );
    event ControllerUpdated(address controller, bool authorized);

    modifier onlyController() {
        require(authorizedControllers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier onlyTeamOwner(bytes32 _teamId) {
        require(teams[_teamId].owner == msg.sender, "Not team owner");
        _;
    }

    constructor(address _usdcAddress, uint256 _maxTeamPaymentAmount) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
        maxTeamPaymentAmount = _maxTeamPaymentAmount;
        authorizedControllers[msg.sender] = true;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setMaxTeamPaymentAmount(uint256 _maxAmount) external onlyOwner {
        maxTeamPaymentAmount = _maxAmount;
    }

    function setController(address _controller, bool _authorized) external onlyOwner {
        authorizedControllers[_controller] = _authorized;
        emit ControllerUpdated(_controller, _authorized);
    }

    function createTeam(
        string memory _name,
        address[] memory _members,
        uint256[] memory _shares
    ) external whenNotPaused returns (bytes32) {
        require(bytes(_name).length > 0, "Team name required");
        require(_members.length > 0, "No team members specified");
        require(_members.length == _shares.length, "Members and shares length mismatch");
        require(_members.length <= 20, "Too many team members");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_members[i] != address(0), "Invalid member address");
            require(_shares[i] > 0, "Share must be greater than 0");
            require(_shares[i] <= 10000, "Share cannot exceed 100%");
            totalShares += _shares[i];
        }
        
        require(totalShares == 10000, "Total shares must equal 10000 (100%)");
        
        bytes32 teamId = keccak256(abi.encodePacked(
            msg.sender,
            _name,
            block.timestamp,
            block.prevrandao
        ));
        
        require(teams[teamId].owner == address(0), "Team ID collision");
        
        teams[teamId] = Team({
            owner: msg.sender,
            name: _name,
            members: _members,
            shares: _shares,
            active: true,
            createdAt: block.timestamp
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
    ) external nonReentrant whenNotPaused returns (bytes32) {
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        require(team.active, "Team is not active");
        require(_totalAmount > 0, "Amount must be greater than 0");
        require(_totalAmount <= maxTeamPaymentAmount, "Amount exceeds maximum");
        
        require(usdcToken.balanceOf(msg.sender) >= _totalAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= _totalAmount, "Insufficient allowance");
        
        uint256[] memory amounts = new uint256[](team.members.length);
        uint256 calculatedTotal = 0;
        
        for (uint256 i = 0; i < team.members.length; i++) {
            amounts[i] = (_totalAmount * team.shares[i]) / 10000;
            calculatedTotal += amounts[i];
        }
        
        require(calculatedTotal <= _totalAmount, "Calculation error: total exceeded");
        
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
            block.timestamp,
            block.prevrandao
        ));
        
        emit TeamPaymentExecuted(_teamId, paymentId, _totalAmount);
        
        return paymentId;
    }

    function updateTeam(
        bytes32 _teamId,
        address[] memory _members,
        uint256[] memory _shares
    ) external whenNotPaused onlyTeamOwner(_teamId) {
        Team storage team = teams[_teamId];
        require(team.active, "Team is not active");
        require(_members.length == _shares.length, "Members and shares length mismatch");
        require(_members.length <= 20, "Too many team members");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_members[i] != address(0), "Invalid member address");
            require(_shares[i] > 0, "Share must be greater than 0");
            require(_shares[i] <= 10000, "Share cannot exceed 100%");
            totalShares += _shares[i];
        }
        
        require(totalShares == 10000, "Total shares must equal 10000 (100%)");
        
        team.members = _members;
        team.shares = _shares;
        
        emit TeamUpdated(_teamId);
    }

    function deactivateTeam(bytes32 _teamId) external onlyTeamOwner(_teamId) {
        Team storage team = teams[_teamId];
        require(team.active, "Team already inactive");
        
        team.active = false;
        emit TeamDeactivated(_teamId);
    }

    function activateTeam(bytes32 _teamId) external onlyTeamOwner(_teamId) {
        Team storage team = teams[_teamId];
        require(!team.active, "Team already active");
        
        team.active = true;
        emit TeamUpdated(_teamId);
    }

    function getTeam(bytes32 _teamId) external view returns (
        address owner,
        string memory name,
        address[] memory members,
        uint256[] memory shares,
        bool active,
        uint256 createdAt
    ) {
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        
        return (
            team.owner,
            team.name,
            team.members,
            team.shares,
            team.active,
            team.createdAt
        );
    }

    function getUserTeams(address _user) external view returns (bytes32[] memory) {
        return userTeams[_user];
    }

    function getTeamMemberCount(bytes32 _teamId) external view returns (uint256) {
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        
        return team.members.length;
    }

    function emergencyDeactivateTeam(bytes32 _teamId) external onlyOwner {
        Team storage team = teams[_teamId];
        require(team.active, "Team already inactive");
        
        team.active = false;
        emit TeamDeactivated(_teamId);
    }
}