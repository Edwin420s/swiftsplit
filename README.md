# SwiftSplit

**Fast, simple, and intelligent cross-border payments for freelancers and teams.**

SwiftSplit is an AI-powered payment platform built on Arc blockchain, designed to simplify cross-border freelance payments using USDC. The platform combines AI-driven invoice parsing, natural language payment commands, and automated team payment splitting to eliminate friction in global freelance transactions.

---

## 🎯 Problem Statement

Freelancers in emerging markets (Africa, Asia, Latin America) face significant challenges receiving USD payments:
- **High Fees**: Traditional payment platforms charge 4-20% in fees
- **Slow Settlements**: Transfers take 3-7 business days
- **Limited Access**: Many freelancers lack access to USD banking infrastructure
- **Manual Splits**: Teams must manually divide payments among multiple contributors

SwiftSplit solves these problems with AI-powered payment automation on Arc blockchain using USDC as the settlement currency.

---

## ✨ Features

### 🤖 AI-Powered Payment Processing
- **Invoice Parsing**: Upload PDF/image invoices → AI extracts payment details automatically
- **Chat Commands**: Natural language payment requests like "Pay Jane $120 for logo design"
- **Voice Payments**: Optional voice-activated payment commands via ElevenLabs integration
- **Smart Verification**: AI validates recipients, amounts, and payment intent before execution

### ⚡ Instant USDC Payments on Arc
- **Fast Settlement**: Sub-second transaction confirmations on Arc blockchain
- **Low Fees**: USDC-native gas on Arc ensures predictable, minimal costs
- **Global Access**: Anyone with an internet connection can send/receive USDC

### 👥 Automated Team Splitting
- **Smart Distribution**: Automatically split payments among team members by percentage or fixed amounts
- **Transparent Tracking**: All splits recorded on-chain for full auditability
- **Flexible Teams**: Create and manage multiple team configurations

### 🔐 Secure & Compliant
- **Circle Wallet Integration**: Simplified onboarding and KYC-compliant custody
- **Multi-Layer Validation**: AI + backend + smart contract verification
- **Audit Trail**: Immutable on-chain records + structured database logs

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Arc (EVM-compatible) | Smart contracts for USDC payments and splitting |
| **Stablecoin** | USDC | Payment token and gas currency |
| **Wallets** | Circle Wallet / Thirdweb | User onboarding, identity verification, gasless txns |
| **Backend** | Node.js + Express | Orchestrates AI, databases, smart contracts |
| **Structured DB** | PostgreSQL | Users, payments, teams, audit logs (ACID compliant) |
| **Unstructured DB** | MongoDB | AI logs, invoice parsing, chat messages |
| **AI Layer** | LangChain / OpenAI / ElevenLabs | Invoice/chat/voice parsing + intent detection |
| **File Storage** | IPFS | Decentralized invoice and attachment storage |
| **Frontend** | React + Tailwind | Dashboard, payment interface, notifications |
| **Smart Contracts** | Solidity | Payment creation, execution, team splitting |

### System Flow

```
1. User Input (Invoice/Chat/Voice)
   ↓
2. AI Parsing & Validation (MongoDB logs)
   ↓
3. Backend Verification (PostgreSQL checks)
   ↓
4. Smart Contract Execution (Arc blockchain)
   ↓
5. Event Emission → Database Updates
   ↓
6. Real-time Notifications (Socket.io)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0
- PostgreSQL >= 14
- MongoDB >= 6.0
- Arc Testnet Wallet with USDC

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Edwin420s/swiftsplit.git
cd swiftsplit
```

2. **Install dependencies**
```bash
# Install all modules
npm install

# Or install individually
cd frontend && npm install
cd ../backend && npm install
cd ../contracts && npm install
cd ../ai-modules && npm install
```

3. **Configure environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Contracts
cp contracts/.env.example contracts/.env
# Add your Arc wallet private key and RPC URL

# Frontend
cp frontend/.env.example frontend/.env
# Set VITE_API_BASE_URL=http://localhost:5000/api
# Set VITE_ARC_RPC_URL and contract addresses after deployment
# (Backend will use AI_MODULES_URL=http://localhost:3001 to reach AI services)
```

4. **Deploy Smart Contracts**
```bash
cd contracts
npm run compile
npm run deploy  # Deploys to Arc Testnet
```

5. **Start Services**

```bash
# Terminal 1: Start PostgreSQL and MongoDB (via Docker)
docker-compose up -d

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start AI Modules
cd ai-modules
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Modules: http://localhost:3001

---

## 📂 Project Structure

```
swiftsplit/
├── frontend/              # React + Tailwind UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── contexts/      # React contexts (Wallet, etc.)
│   │   ├── services/      # API client
│   │   └── styles/        # Tailwind CSS
│   └── package.json
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models (PostgreSQL + MongoDB)
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, validation, error handling
│   │   └── config/        # Database and app configuration
│   └── package.json
│
├── contracts/             # Solidity smart contracts
│   ├── contracts/         # SwiftSplit.sol, TeamSplitter.sol
│   ├── scripts/           # Deployment and interaction scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js
│
├── ai-modules/            # AI parsing services
│   ├── invoice-parser/    # OCR + NLP for invoices
│   ├── chat-parser/       # Natural language payment commands
│   ├── voice-parser/      # Voice command processing
│   └── shared/            # Validation and utilities
│
├── docker-compose.yml     # Local PostgreSQL + MongoDB setup
└── README.md
```

---

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm test
npm run test:coverage
```

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

---

## 🌍 Deployment

### Backend (Render / Vercel)
```bash
cd backend
# Set environment variables in Render dashboard
git push
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
vercel deploy
```

### Smart Contracts (Arc Mainnet)
```bash
cd contracts
npm run deploy:mainnet
npm run verify:mainnet
```

---

## 🔑 Environment Variables

See `.env.example` files in each module for required configuration:
- **Backend**: Database credentials, Arc RPC URL, Circle API keys, OpenAI API key
- **Contracts**: Arc wallet private key, RPC URLs, contract addresses
- **AI Modules**: OpenAI API key, ElevenLabs API key (optional)

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📞 Contact

- **Team**: SwiftSplit Team
- **Email**: team@swiftsplit.com
- **Discord**: [Join our server]
- **Twitter**: [@SwiftSplitHQ]

---

## 🙏 Acknowledgments

- **Circle** for Arc blockchain and USDC infrastructure
- **ElevenLabs** for voice AI capabilities
- **Cloudflare** for Workers AI

---

Built with ❤️ for the global freelance economy
