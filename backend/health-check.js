const http = require('http');
const { sequelize } = require('./src/config/database');
const mongoose = require('mongoose');

/**
 * Health check for SwiftSplit backend
 * Checks database connections and basic functionality
 */

const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  timeout: 5000,
  headers: {
    'User-Agent': 'SwiftSplit-HealthCheck/1.0'
  }
};

async function checkDatabaseConnections() {
  try {
    // Check PostgreSQL connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection healthy');

    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection healthy');
    } else {
      throw new Error('MongoDB not connected');
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkAPIHealth() {
  return new Promise((resolve, reject) => {
    const request = http.request(options, (res) => {
      console.log(`✅ API Health Check: STATUS ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            console.log('📊 Service Status:', healthData.status);
            console.log('🕒 Timestamp:', healthData.timestamp);
            resolve(true);
          } catch (parseError) {
            console.error('❌ Failed to parse health response:', parseError.message);
            resolve(false);
          }
        });
      } else {
        console.error(`❌ API returned non-200 status: ${res.statusCode}`);
        resolve(false);
      }
    });

    request.on('error', (err) => {
      console.error('❌ API Health Check failed:', err.message);
      resolve(false);
    });

    request.on('timeout', () => {
      console.error('❌ API Health Check timeout');
      request.destroy();
      resolve(false);
    });

    request.end();
  });
}

async function comprehensiveHealthCheck() {
  console.log('🏥 Starting SwiftSplit Comprehensive Health Check...\n');

  // Check database connections
  const dbHealthy = await checkDatabaseConnections();
  
  // Check API health
  const apiHealthy = await checkAPIHealth();

  // Overall health status
  const overallHealthy = dbHealthy && apiHealthy;

  console.log('\n📋 Health Check Summary:');
  console.log('======================');
  console.log(`PostgreSQL: ${dbHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`MongoDB: ${dbHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`API Server: ${apiHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`Overall: ${overallHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log('======================\n');

  process.exit(overallHealthy ? 0 : 1);
}

// Run health check if this script is executed directly
if (require.main === module) {
  comprehensiveHealthCheck();
}

module.exports = {
  checkDatabaseConnections,
  checkAPIHealth,
  comprehensiveHealthCheck
};