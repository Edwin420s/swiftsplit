# SwiftSplit - Quick Start Guide

Get SwiftSplit running in **5 minutes** ⚡

---

## 🚀 Prerequisites

- Node.js >= 18.0
- Docker Desktop (for databases)
- Git

---

## 📦 Installation

### 1. Install Dependencies
```bash
# Install all dependencies at once
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
cd ../contracts && npm install
cd ../ai-modules && npm install
```

---

## ⚙️ Configuration

### 2. Set Up Environment Variables

**Backend:**
```bash
cd backend
copy .env.example .env
# Edit .env with your settings
```

**Frontend:**
```bash
cd frontend
copy .env.example .env
```

**Contracts:**
```bash
cd contracts
copy .env.example .env
# Add your Arc wallet private key
```

---

## 🗄️ Start Databases

```bash
# Start PostgreSQL + MongoDB via Docker
docker-compose up -d

# Check if running
docker ps
```

---

## 🏗️ Deploy Smart Contracts (Optional for local dev)

```bash
cd contracts
npm run compile
npm run deploy  # Deploys to Arc Testnet
```

---

## 🎯 Start All Services

### Option 1: Automated (Windows)
```bash
start-all.bat
```

### Option 2: Manual
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: AI Modules
cd ai-modules
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

---

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Modules**: http://localhost:3001

---

## ✅ Verify Everything Works

### 1. Check Backend Health
```bash
curl http://localhost:5000/health
```

### 2. Check AI Modules Health
```bash
curl http://localhost:3001/health
```

### 3. Check Frontend
Open http://localhost:3000 in your browser

---

## 🧪 Test Payment Flow

1. **Upload an invoice** → AI parses recipient and amount
2. **Or use chat**: "Pay Jane $120 for logo design"
3. **Verify** → Backend validates via AI modules
4. **Execute** → Smart contract transfers USDC on Arc

---

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Reset databases
docker-compose down
docker-compose up -d
```

### Port Already in Use
```bash
# Change ports in:
# - frontend/vite.config.js (port: 3000)
# - backend/.env (PORT=5000)
# - ai-modules/server.js (PORT=3001)
```

### AI Modules Not Responding
```bash
# Backend will fallback to mock parsing
# Check backend/.env: AI_MODULES_URL=http://localhost:3001
```

---

## 📚 Next Steps

- Read [README.md](README.md) for full architecture
- Check [AI Modules README](ai-modules/README.md) for AI configuration
- Review [Contracts README](contracts/README.md) for deployment details

---

**Ready to build? Start coding!** 🚀
