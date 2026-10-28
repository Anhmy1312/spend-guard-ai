/**
 * NEAR Blockchain Integration Service using near-api-js
 * SpendGuard AI - NEAR Hackathon 2026
 */

const nearAPI = require('near-api-js');
const { connect, keyStores, KeyPair, utils } = nearAPI;
const path = require('path');
const os = require('os');

// NEAR Testnet configuration
const NEAR_CONFIG = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://testnet.nearblocks.io',
};

/**
 * Check connection to NEAR Testnet and return network status
 */
async function checkNearConnection() {
  try {
    // Use in-memory key store for lightweight backend operation
    const keyStore = new keyStores.InMemoryKeyStore();
    const config = { ...NEAR_CONFIG, keyStore };
    
    const near = await connect(config);
    const provider = near.connection.provider;
    const status = await provider.status();
    
    return {
      connected: true,
      networkId: NEAR_CONFIG.networkId,
      latestBlockHeight: status.sync_info.latest_block_height
    };
  } catch (error) {
    console.error('Failed to connect to NEAR Testnet:', error.message);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Execute or simulate a NEAR Testnet transfer transaction when proposal is approved
 * @param {string} recipientId - Receiver NEAR account (e.g. recipient.testnet)
 * @param {number} amountInNear - Amount in NEAR tokens to transfer
 */
async function executeApprovalTransaction(recipientId, amountInNear) {
  try {
    // For hackathon MVP demonstration, we connect to testnet provider
    const keyStore = new keyStores.InMemoryKeyStore();
    const config = { ...NEAR_CONFIG, keyStore };
    
    const near = await connect(config);
    
    // Convert NEAR amount to YoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    const amountInYocto = utils.format.parseNearAmount(amountInNear.toString());

    // In a full production app, this would use the user's signed transaction or backend keypair.
    // For hackathon MVP safety, we return a successful testnet transaction simulation receipt 
    // with valid Explorer link format.
    
    console.log(`[NEAR Testnet] Processing transfer of ${amountInNear} NEAR to ${recipientId}`);
    
    // Return mock successful testnet transaction hash & explorer link for demo purposes
    const mockTxHash = 'SpendGuardTestTx' + Math.random().toString(36).substring(2, 10);
    const explorerUrl = `${NEAR_CONFIG.explorerUrl}/txs/${mockTxHash}`;

    return {
      success: true,
      txHash: mockTxHash,
      explorerUrl,
      amount: amountInNear,
      recipient: recipientId,
      network: 'testnet'
    };
  } catch (error) {
    console.error('NEAR transaction execution error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  checkNearConnection,
  executeApprovalTransaction
};
