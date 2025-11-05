const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { connectPostgreSQL, connectMongoDB } = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimit');
const errorMiddleware = require('./middleware/errorMiddleware');
const socketAuth = require('./middleware/socketAuth');
const notificationService = require('./services/notificationService');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const teamRoutes = require('./routes/teams');
const walletRoutes = require('./routes/wallets');
const voiceRoutes = require('./routes/voice');
const analyticsRoutes = require('./routes/analytics');

class App {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    await connectPostgreSQL();
    await connectMongoDB();
  }

  initializeMiddlewares() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'SwiftSplit Backend',
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/ai', aiRoutes);
    this.app.use('/api/teams', teamRoutes);
    this.app.use('/api/wallets', walletRoutes);
    this.app.use('/api/voice', voiceRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
      });
    });
  }

  initializeSocketIO() {
    // Socket.io authentication
    this.io.use(socketAuth);

    // Socket.io connection handling
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      socket.on('join_team', (teamId) => {
        socket.join(`team_${teamId}`);
        console.log(`User ${socket.userId} joined team ${teamId}`);
      });

      socket.on('payment_status', (data) => {
        socket.to(`user_${data.recipientId}`).emit('payment_received', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
      });
    });

    // Set Socket.io in notification service
    notificationService.setSocketIO(this.io);
    
    // Make io available to routes
    this.app.set('socketio', this.io);
  }

  initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  start(port = process.env.PORT || 5000) {
    this.server.listen(port, () => {
      console.log(`
🚀 SwiftSplit Backend Server Started!
📍 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 PostgreSQL: Connected
🗄️ MongoDB: Connected
🔗 Socket.IO: Ready
      `);
    });

    return this.server;
  }
}

module.exports = App;