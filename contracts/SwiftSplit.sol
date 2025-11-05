// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SwiftSplit is Ownable, ReentrancyGuard, Pausable {
    IERC20 public usdcToken;
    uint256 public maxPaymentAmount;
    
    enum PaymentStatus { PENDING, COMPLETED, FAILED, CANCELLED }
    
    struct Payment {
        address payer;
        address[] recipients;
        uint256[] amounts;
        string invoiceId;
        PaymentStatus status;
        uint256 createdAt;
        uint256 executedAt;
    }
    
    mapping(bytes32 => Payment) public payments;
    mapping(address => bool) public authorizedControllers;
    
    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed payer,
        address[] recipients,
        uint256[] amounts,
        string invoiceId
    );
    
    event PaymentExecuted(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 totalAmount
    );
    
    event PaymentFailed(
        bytes32 indexed paymentId,
        string reason
    );

    event ControllerUpdated(address controller, bool authorized);

    modifier onlyController() {
        require(authorizedControllers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _usdcAddress, uint256 _maxPaymentAmount) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
        maxPaymentAmount = _maxPaymentAmount;
        authorizedControllers[msg.sender] = true;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setMaxPaymentAmount(uint256 _maxAmount) external onlyOwner {
        maxPaymentAmount = _maxAmount;
    }

    function setController(address _controller, bool _authorized) external onlyOwner {
        authorizedControllers[_controller] = _authorized;
        emit ControllerUpdated(_controller, _authorized);
    }

    function createPayment(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _invoiceId
    ) external whenNotPaused returns (bytes32) {
        require(_recipients.length > 0, "No recipients specified");
        require(_recipients.length == _amounts.length, "Recipients and amounts length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient address");
            require(_amounts[i] > 0, "Amount must be greater than 0");
            totalAmount += _amounts[i];
        }
        
        require(totalAmount <= maxPaymentAmount, "Payment amount exceeds maximum");
        require(usdcToken.balanceOf(msg.sender) >= totalAmount, "Insufficient USDC balance");
        require(usdcToken.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient allowance");
        
        bytes32 paymentId = keccak256(abi.encodePacked(
            msg.sender,
            _invoiceId,
            block.timestamp,
            block.prevrandao
        ));
        
        require(payments[paymentId].payer == address(0), "Payment ID collision");
        
        payments[paymentId] = Payment({
            payer: msg.sender,
            recipients: _recipients,
            amounts: _amounts,
            invoiceId: _invoiceId,
            status: PaymentStatus.PENDING,
            createdAt: block.timestamp,
            executedAt: 0
        });
        
        emit PaymentCreated(paymentId, msg.sender, _recipients, _amounts, _invoiceId);
        
        return paymentId;
    }

    function executePayment(bytes32 _paymentId) external nonReentrant whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.payer != address(0), "Payment does not exist");
        require(payment.status == PaymentStatus.PENDING, "Payment already processed");
        require(msg.sender == payment.payer || authorizedControllers[msg.sender], "Not authorized");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < payment.amounts.length; i++) {
            totalAmount += payment.amounts[i];
        }
        
        require(
            usdcToken.balanceOf(payment.payer) >= totalAmount,
            "Payer has insufficient balance"
        );
        require(
            usdcToken.allowance(payment.payer, address(this)) >= totalAmount,
            "Insufficient token allowance"
        );
        
        for (uint256 i = 0; i < payment.recipients.length; i++) {
            bool success = usdcToken.transferFrom(
                payment.payer,
                payment.recipients[i],
                payment.amounts[i]
            );
            require(success, "USDC transfer failed");
        }
        
        payment.status = PaymentStatus.COMPLETED;
        payment.executedAt = block.timestamp;
        
        emit PaymentExecuted(_paymentId, payment.payer, totalAmount);
    }

    function cancelPayment(bytes32 _paymentId) external {
        Payment storage payment = payments[_paymentId];
        
        require(payment.payer != address(0), "Payment does not exist");
        require(
            msg.sender == payment.payer || msg.sender == owner() || authorizedControllers[msg.sender],
            "Not authorized to cancel"
        );
        require(payment.status == PaymentStatus.PENDING, "Payment not pending");
        
        payment.status = PaymentStatus.CANCELLED;
        
        emit PaymentFailed(_paymentId, "Payment cancelled");
    }

    function emergencyCancel(bytes32 _paymentId) external onlyOwner {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.PENDING, "Payment not pending");
        
        payment.status = PaymentStatus.CANCELLED;
        emit PaymentFailed(_paymentId, "Emergency cancelled by owner");
    }

    function getPayment(bytes32 _paymentId) external view returns (
        address payer,
        address[] memory recipients,
        uint256[] memory amounts,
        string memory invoiceId,
        PaymentStatus status,
        uint256 createdAt,
        uint256 executedAt
    ) {
        Payment storage payment = payments[_paymentId];
        require(payment.payer != address(0), "Payment does not exist");
        
        return (
            payment.payer,
            payment.recipients,
            payment.amounts,
            payment.invoiceId,
            payment.status,
            payment.createdAt,
            payment.executedAt
        );
    }

    function getPaymentTotal(bytes32 _paymentId) external view returns (uint256) {
        Payment storage payment = payments[_paymentId];
        require(payment.payer != address(0), "Payment does not exist");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < payment.amounts.length; i++) {
            totalAmount += payment.amounts[i];
        }
        
        return totalAmount;
    }
}