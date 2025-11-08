# SwiftSplit

**Fast, simple, and intelligent cross-border payments for freelancers and teams.**

> 🏆 **Built for the AI Agents on Arc with USDC Hackathon**  
> Track: Payments for Content & Freelance Work

SwiftSplit is an AI-powered payment platform built on Arc blockchain, designed to simplify cross-border freelance payments using USDC. The platform combines AI-driven invoice parsing, natural language payment commands, and automated team payment splitting to eliminate friction in global freelance transactions.

### 📺 Demo & Links
- **Live Demo**: https://swiftsplit.vercel.app/
- **GitHub**: https://github.com/Edwin420s/swiftsplit
- **Documentation**: See [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md) for full technical audit
- **Video Demo**: [Coming Soon]

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

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| MongoDB Database | ✅ Complete | All 7 collections implemented |
| User Authentication | ✅ Complete | JWT-based auth with bcrypt |
| Payment Creation | ✅ Complete | Single & multi-recipient support |
| Team Splitting | ✅ Complete | Percentage & fixed amount splits |
| AI Invoice Parsing | ✅ Complete | With mock fallback |
| AI Chat Parsing | ✅ Complete | Natural language commands |
| Voice Commands | ✅ Complete | ElevenLabs integration |
| Smart Contracts | ✅ Complete | Deployed on Arc Testnet |
| Blockchain Integration | ✅ Complete | ethers.js v6 with Arc RPC |
| Real-time Notifications | ✅ Complete | Socket.io configured |
| Frontend API Client | ✅ Complete | All endpoints integrated |
| Circle Wallet Integration | ⚠️ Configured | Requires API keys |
| IPFS Storage | ⚠️ Planned | Local file storage currently |
| Production Deployment | ⚠️ Ready | MongoDB Atlas recommended |

---

## 🏗️ Architecture

### Database Architecture
**SwiftSplit uses MongoDB exclusively** for all data storage:
- ✅ User accounts and wallet addresses
- ✅ Payment transactions and history
- ✅ Team configurations and splits
- ✅ AI parsing logs and confidence scores
- ✅ Invoice data and chat messages
- ✅ Audit logs and analytics

This single-database design simplifies deployment, reduces infrastructure costs, and provides flexibility for unstructured AI data while maintaining ACID compliance through MongoDB transactions.

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Arc (EVM-compatible) | Smart contracts for USDC payments and splitting |
| **Stablecoin** | USDC | Payment token and gas currency |
| **Wallets** | Circle Wallet / Thirdweb | User onboarding, identity verification, gasless txns |
| **Backend** | Node.js + Express | Orchestrates AI, databases, smart contracts |
| **Database** | MongoDB | All application data (users, payments, AI logs, teams, etc.) |
| **AI Layer** | LangChain / OpenAI / ElevenLabs | Invoice/chat/voice parsing + intent detection |
| **File Storage** | IPFS | Decentralized invoice and attachment storage |
| **Frontend** | React + Tailwind | Dashboard, payment interface, notifications |
| **Smart Contracts** | Solidity | Payment creation, execution, team splitting |

### System Flow

```
1. User Input (Invoice/Chat/Voice)
   ↓
2. AI Parsing & Validation (logged to MongoDB)
   ↓
3. Backend Verification (MongoDB user & payment checks)
   ↓
4. Smart Contract Execution (Arc blockchain)
   ↓
5. Event Emission → MongoDB Updates
   ↓
6. Real-time Notifications (Socket.io)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0
- MongoDB >= 6.0 **OR** MongoDB Atlas account (cloud)
- Arc Testnet Wallet with USDC
- Docker & Docker Compose (optional, for local MongoDB)

**MongoDB Options:**
- **Option 1 (Recommended)**: Use Docker: `docker-compose up -d mongodb`
- **Option 2**: Install MongoDB locally
- **Option 3**: Use MongoDB Atlas (free tier available at mongodb.com/atlas)

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

4. **Start MongoDB**

**Option A: Using Docker (Recommended)**
```bash
# Start MongoDB (and optionally Redis)
docker-compose up -d mongodb
```

**Option B: Using MongoDB Atlas**
```bash
# Update backend/.env with your Atlas connection string:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/swiftsplit
```

5. **Deploy Smart Contracts**
```bash
cd contracts
npm run compile
npm run deploy  # Deploys to Arc Testnet
```

6. **Start Services**

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start AI Modules
cd ai-modules
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

7. **Access the Application**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:5000
- AI Modules: http://localhost:3001
- MongoDB: mongodb://localhost:27017 (if using Docker)

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
│   │   ├── models/        # MongoDB models (Mongoose schemas)
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
├── docker-compose.yml     # Local MongoDB + Redis setup
├── INTEGRATION_REPORT.md  # Comprehensive integration audit
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

### MongoDB (Production)
**Use MongoDB Atlas for production:**
1. Create a free cluster at https://mongodb.com/atlas
2. Whitelist your server IP addresses
3. Create a database user with readWrite permissions
4. Get your connection string and update `MONGODB_URI` in production environment

### Backend (Render / Railway / AWS)
```bash
cd backend
# Set environment variables in your hosting dashboard:
# - MONGODB_URI (Atlas connection string)
# - All other variables from .env.example
git push
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
vercel deploy
# Set VITE_API_BASE_URL to your production backend URL
```

### AI Modules (Same host as backend or separate)
```bash
cd ai-modules
# Deploy as a separate service or bundle with backend
# Set AI_MODULES_URL in backend .env to point to this service
```

### Smart Contracts (Arc Mainnet)
```bash
cd contracts
npm run deploy:mainnet
npm run verify:mainnet
# Update backend/.env with deployed contract addresses
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# View MongoDB logs
docker logs swiftsplit-mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Won't Start
```bash
# Check if .env file exists
ls backend/.env

# Verify MongoDB connection string
cat backend/.env | grep MONGODB_URI

# Check backend logs
cd backend
npm run dev
```

### AI Modules Not Working
- AI Modules are optional - backend has built-in fallback mock parsing
- Check if AI Modules server is running on port 3001
- Verify OpenAI API key in AI modules `.env`
- Backend will log "Using mock AI parsing" if modules are unavailable

### Smart Contract Deployment Fails
```bash
# Verify you have Arc testnet funds
# Check your private key in contracts/.env
# Ensure RPC URL is correct: https://sepolia.arc.gateway.fm
```

---

## 🔑 Environment Variables

See `.env.example` files in each module for required configuration:
- **Backend**: MongoDB URI, Arc RPC URL, Circle API keys, OpenAI API key, ElevenLabs API key
- **Contracts**: Arc wallet private key, RPC URLs, contract addresses
- **AI Modules**: OpenAI API key, ElevenLabs API key (optional)
- **Frontend**: API base URL, Arc RPC URL

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! 

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Priority areas:**
- Frontend UI/UX improvements
- Additional AI parsing models
- Test coverage
- Documentation improvements
- IPFS integration for invoice storage

---

## 📞 Contact

- **Team**: SwiftSplit Team
- **Email**: team@swiftsplit.com
- **Discord**: [Join our server]
- **Twitter**: [@SwiftSplitHQ]

---

## 🙏 Acknowledgments

This project was built for the **AI Agents on Arc with USDC Hackathon**. Special thanks to:

- **Circle** for Arc blockchain infrastructure and native USDC support
- **OpenAI** for AI language models powering invoice and chat parsing
- **ElevenLabs** for voice AI capabilities (optional feature)
- **MongoDB** for flexible document database
- **Hardhat** for Solidity development and testing

---

## 📊 Project Status

- ✅ **MongoDB-only architecture** - Simplified from hybrid design
- ✅ **Smart contracts deployed** on Arc Testnet
- ✅ **Backend API** fully functional with all services integrated
- ✅ **AI Modules** operational with fallback support
- ✅ **Frontend** configured and ready
- ⚠️ **Production deployment** pending (ready for deployment)

See [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md) for comprehensive technical audit.

---

Built with ❤️ for the global freelance economy | **AI Agents on Arc with USDC Hackathon 2025**
