# SwiftSplit Wallet Integration Guide

## Overview

SwiftSplit now supports **wallet-based authentication** using MetaMask, Core Wallet, WalletConnect, and any EVM-compatible wallet. Users authenticate by signing a message with their wallet instead of email/password.

---

## Architecture

### Frontend (React + ethers.js)
- **Wallet Connection**: `frontend/src/utils/walletConnection.js`
- **Wallet Context**: `frontend/src/contexts/WalletContext.jsx`
- **Landing Page**: Wallet connect button instead of email signup

### Backend (Node.js + Express)
- **Auth Controller**: Wallet signature verification
- **User Model**: Support for wallet-only users
- **Auth Routes**: `/auth/nonce` and `/auth/wallet-login`

### Smart Contract (Solidity)
- **SwiftSplit.sol**: USDC payment execution with `transferFrom`
- **Approval Pattern**: Users approve contract to spend USDC
- **Multi-recipient**: Split payments to multiple addresses

---

## User Flow

### 1. Connect Wallet
```
User clicks "Connect Wallet" → MetaMask/Core prompts → User approves → Wallet connected
```

### 2. Sign Authentication Message
```
Frontend requests nonce from backend
→ User signs message with nonce
→ Backend verifies signature
→ JWT token issued
```

### 3. Make Payment
```
User creates payment (recipients + amounts)
→ Approve USDC spending (one-time)
→ Execute payment on smart contract
→ USDC transferred to recipients
```

---

## Implementation Details

### Frontend: Wallet Connection

**File**: `frontend/src/utils/walletConnection.js`

```javascript
export async function connectWallet() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = provider.getSigner()
  const address = await signer.getAddress()
  return { provider, signer, address }
}
```

**Features**:
- ✅ Automatic Arc testnet switching
- ✅ Account change detection
- ✅ Network change detection
- ✅ USDC balance fetching
- ✅ Approve & execute payment functions

### Backend: Signature Verification

**File**: `backend/src/controllers/authController.js`

```javascript
// Generate nonce
GET /api/auth/nonce?address=0x...

// Verify signature and login
POST /api/auth/wallet-login
{
  "address": "0x...",
  "signature": "0x...",
  "nonce": "abc123..."
}
```

**Security**:
- ✅ Nonce expires after 5 minutes
- ✅ Signature verification using ethers.utils.verifyMessage
- ✅ Nonce can only be used once
- ✅ Auto-creates user if wallet not registered

### Smart Contract: Payment Execution

**File**: `contracts/contracts/SwiftSplit.sol`

```solidity
function executePayment(bytes32 _paymentId) external {
    Payment storage payment = payments[_paymentId];
    
    // Transfer USDC from payer to each recipient
    for (uint256 i = 0; i < payment.recipients.length; i++) {
        usdcToken.transferFrom(
            payment.payer,
            payment.recipients[i],
            payment.amounts[i]
        );
    }
    
    payment.status = PaymentStatus.COMPLETED;
}
```

---

## Configuration

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USDC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Arc Testnet Configuration

```javascript
export const ARC_TESTNET_CONFIG = {
  chainId: '0x13e31', // 81457
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6
  },
  rpcUrls: ['https://rpc-testnet.arc.xyz'],
  blockExplorerUrls: ['https://testnet.arcscan.xyz']
}
```

---

## Supported Wallets

### ✅ MetaMask
- Browser extension
- Mobile app
- Most popular choice

### ✅ Core Wallet
- Avalanche ecosystem wallet
- Multi-chain support

### ✅ WalletConnect
- Connect via QR code
- Supports 100+ mobile wallets
- Trust Wallet, Rainbow, etc.

### ✅ Any EVM Wallet
- Coinbase Wallet
- Brave Wallet
- Frame
- Any wallet supporting `window.ethereum`

---

## Payment Flow

### Step 1: Approve USDC Spending

```javascript
// Frontend calls approve on USDC contract
await usdcContract.approve(contractAddress, totalAmount)
```

### Step 2: Execute Payment

```javascript
// Frontend calls SwiftSplit contract
await contract.executePayment(recipients, amounts)
```

### Step 3: Blockchain Confirmation

```javascript
// Listen for events
contract.on('PaymentExecuted', (paymentId, payer, totalAmount) => {
  console.log(`Payment ${paymentId} completed!`)
})
```

---

## Database Schema

### User Model (MongoDB)

```javascript
{
  walletAddress: "0x742d35cc6634c893292", // Primary identifier
  name: "User 0x742d",                     // Auto-generated
  role: "freelancer",
  authMethod: "wallet",                    // 'wallet' or 'email'
  email: null,                              // Optional
  password: null,                           // Not required for wallet auth
  createdAt: "2025-11-08T...",
  updatedAt: "2025-11-08T..."
}
```

---

## API Endpoints

### Authentication

**Generate Nonce**
```
GET /api/auth/nonce?address=0x...
Response: { "nonce": "abc123..." }
```

**Wallet Login**
```
POST /api/auth/wallet-login
Body: {
  "address": "0x...",
  "signature": "0x...",
  "nonce": "abc123..."
}
Response: {
  "user": { ... },
  "token": "jwt_token..."
}
```

**Get Profile**
```
GET /api/auth/profile
Headers: { "Authorization": "Bearer jwt_token..." }
Response: {
  "walletAddress": "0x...",
  "name": "...",
  "balance": 1500.50
}
```

### Payments

**Create Payment**
```
POST /api/payments
Headers: { "Authorization": "Bearer jwt_token..." }
Body: {
  "recipients": ["0xabc...", "0xdef..."],
  "amounts": [100, 50],
  "txHash": "0x..."
}
```

**Get Payments**
```
GET /api/payments
Headers: { "Authorization": "Bearer jwt_token..." }
Response: {
  "payments": [...]
}
```

---

## Security Considerations

### ✅ Never Store Private Keys
- Wallets manage private keys
- Users sign transactions in their wallet
- Backend never sees private keys

### ✅ Signature Verification
- Nonce prevents replay attacks
- Message signed: `SwiftSplit Login\n\nNonce: ${nonce}`
- ethers.utils.verifyMessage() recovers signer

### ✅ Smart Contract Security
- ReentrancyGuard prevents re-entrancy
- Pausable for emergency stops
- Ownable for admin functions
- Max payment amount limit

### ✅ Rate Limiting
- Nonce generation rate-limited
- Login attempts rate-limited
- API calls rate-limited

---

## Testing

### Local Development

1. **Start Hardhat Node**
```bash
cd contracts
npx hardhat node
```

2. **Deploy Contracts**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Start Backend**
```bash
cd backend
npm run dev
```

4. **Start Frontend**
```bash
cd frontend
npm run dev
```

5. **Connect MetaMask**
- Add localhost network (Chain ID: 31337)
- Import account from Hardhat
- Connect to app

### Arc Testnet

1. **Get Test USDC**
- Visit Arc faucet
- Request testnet USDC

2. **Deploy to Arc Testnet**
```bash
npx hardhat run scripts/deploy.js --network arc-testnet
```

3. **Update Frontend .env**
- Set contract addresses
- Set Arc RPC URL

---

## Troubleshooting

### Wallet Won't Connect
- Check if MetaMask installed
- Try refreshing page
- Check browser console for errors

### Transaction Failing
- Ensure USDC balance sufficient
- Check USDC allowance: `usdc.allowance(user, contract)`
- Verify network is Arc testnet

### Signature Verification Failed
- Nonce may be expired (5 min limit)
- Request new nonce
- Try disconnecting and reconnecting wallet

---

## Next Steps

### Optional Enhancements

1. **WalletConnect Integration**
   - Add WalletConnect provider
   - Support mobile wallets

2. **Gasless Transactions**
   - Implement meta-transactions
   - Use relayer to pay gas

3. **Multi-Wallet Support**
   - Let users link multiple wallets
   - Switch between wallets

4. **ENS Support**
   - Resolve ENS names
   - Display .eth domains

---

## Resources

- [ethers.js Documentation](https://docs.ethers.org/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Arc Blockchain](https://arc.xyz)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

## Support

For issues or questions:
- Check console logs (browser & backend)
- Review transaction on block explorer
- Test with small amounts first

**SwiftSplit** - AI-powered payments with wallet authentication ✨
