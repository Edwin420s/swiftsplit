import { ethers } from 'ethers'

// Arc Testnet Configuration
export const ARC_TESTNET_CONFIG = {
  chainId: '0x13e31', // 81457 in hex
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6
  },
  rpcUrls: ['https://rpc-testnet.arc.xyz'],
  blockExplorerUrls: ['https://testnet.arcscan.xyz']
}

/**
 * Connect to user's wallet (MetaMask, Core, WalletConnect, etc.)
 */
export async function connectWallet() {
  try {
    // Check if wallet is available
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.')
    }

    // Create provider
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    
    // Request account access
    await provider.send('eth_requestAccounts', [])
    
    // Get signer and address
    const signer = provider.getSigner()
    const address = await signer.getAddress()
    
    // Check network and switch to Arc if needed
    const network = await provider.getNetwork()
    const arcChainId = parseInt(ARC_TESTNET_CONFIG.chainId, 16)
    
    if (network.chainId !== arcChainId) {
      await switchToArcNetwork()
    }

    return { provider, signer, address }
  } catch (error) {
    console.error('Wallet connection error:', error)
    throw error
  }
}

/**
 * Switch network to Arc Testnet
 */
export async function switchToArcNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CONFIG.chainId }]
    })
  } catch (switchError) {
    // Chain doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [ARC_TESTNET_CONFIG]
      })
    } else {
      throw switchError
    }
  }
}

/**
 * Sign a message to prove wallet ownership
 */
export async function signMessage(signer, message) {
  try {
    const signature = await signer.signMessage(message)
    return signature
  } catch (error) {
    console.error('Signature error:', error)
    throw error
  }
}

/**
 * Get wallet balance (USDC)
 */
export async function getUSDCBalance(provider, address, usdcAddress) {
  try {
    const usdcABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ]
    
    const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider)
    const balance = await usdcContract.balanceOf(address)
    const decimals = await usdcContract.decimals()
    
    return ethers.utils.formatUnits(balance, decimals)
  } catch (error) {
    console.error('Balance fetch error:', error)
    return '0'
  }
}

/**
 * Approve USDC spending for SwiftSplit contract
 */
export async function approveUSDC(signer, usdcAddress, contractAddress, amount) {
  try {
    const usdcABI = [
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ]
    
    const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)
    
    // Check current allowance
    const currentAllowance = await usdcContract.allowance(
      await signer.getAddress(),
      contractAddress
    )
    
    // If allowance is sufficient, no need to approve again
    if (currentAllowance.gte(amount)) {
      return { alreadyApproved: true }
    }
    
    // Approve spending
    const tx = await usdcContract.approve(contractAddress, amount)
    const receipt = await tx.wait()
    
    return { success: true, txHash: receipt.transactionHash }
  } catch (error) {
    console.error('USDC approval error:', error)
    throw error
  }
}

/**
 * Execute payment via SwiftSplit contract
 */
export async function executePayment(signer, contractAddress, recipients, amounts) {
  try {
    const contractABI = [
      'function executePayment(address[] memory recipients, uint256[] memory amounts) returns (uint256)',
      'event PaymentExecuted(uint256 indexed paymentId, address indexed payer, uint256 totalAmount)'
    ]
    
    const contract = new ethers.Contract(contractAddress, contractABI, signer)
    
    // Execute payment
    const tx = await contract.executePayment(recipients, amounts)
    const receipt = await tx.wait()
    
    // Extract payment ID from event
    const event = receipt.events?.find(e => e.event === 'PaymentExecuted')
    const paymentId = event?.args?.paymentId
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      paymentId: paymentId?.toString()
    }
  } catch (error) {
    console.error('Payment execution error:', error)
    throw error
  }
}

/**
 * Listen for account changes
 */
export function onAccountsChanged(callback) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        callback(null) // User disconnected
      } else {
        callback(accounts[0])
      }
    })
  }
}

/**
 * Listen for network changes
 */
export function onChainChanged(callback) {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', (chainId) => {
      callback(parseInt(chainId, 16))
    })
  }
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
  // Note: Most wallets don't support programmatic disconnect
  // User must disconnect from the wallet extension
  if (window.ethereum?.removeAllListeners) {
    window.ethereum.removeAllListeners('accountsChanged')
    window.ethereum.removeAllListeners('chainChanged')
  }
}

/**
 * Format wallet address for display
 */
export function formatAddress(address) {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address) {
  return ethers.utils.isAddress(address)
}
