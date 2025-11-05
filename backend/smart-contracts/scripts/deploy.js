const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SwiftSplit PaymentSplitter contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get USDC contract address on Arc (this would be the testnet USDC address)
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
  
  if (!usdcAddress) {
    throw new Error("USDC_CONTRACT_ADDRESS environment variable is required");
  }

  const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
  const paymentSplitter = await PaymentSplitter.deploy(usdcAddress);

  await paymentSplitter.waitForDeployment();
  const contractAddress = await paymentSplitter.getAddress();

  console.log("PaymentSplitter deployed to:", contractAddress);
  console.log("USDC Token address:", usdcAddress);

  // Save deployment info to a file for frontend use
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    usdcAddress: usdcAddress,
    network: 'arc-testnet',
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });