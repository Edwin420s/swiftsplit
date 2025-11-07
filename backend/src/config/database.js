const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const syncPostgreSQL = async () => {
  if (process.env.DB_SYNC === 'true') {
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  }
};

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectPostgreSQL,
  connectMongoDB,
  syncPostgreSQL
};