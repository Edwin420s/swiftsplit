const fs = require('fs');
const path = require('path');

function saveDeployment(network, contracts) {
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  
  const deployment = {
    network,
    timestamp: new Date().toISOString(),
    contracts
  };
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`✅ Deployment info saved to ${deploymentFile}`);
}

module.exports = { saveDeployment };
