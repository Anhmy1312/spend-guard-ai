/**
 * NEAR Protocol Integration Module
 * SpendGuard AI - NEAR Hackathon 2026
 * Handles connection to NEAR Testnet and transaction execution.
 */

const { connect, keyStores, utils } = require('near-api-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// NEAR Testnet configuration
const nearConfig = {
  networkId: process.env.NEAR_NETWORK || 'testnet',
  nodeUrl: process.env.NEAR_NODE_URL || 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

// In-memory key store for hackathon demo (simplified)
const keyStore = new keyStores.InMemoryKeyStore();

/**
 * Initialize NEAR connection and load account
 * @returns {Promise<{near: object, account: object}>}
 */
async function initNear() {
  const near = await connect({ ...nearConfig, keyStore });
  
  const accountId = process.env.NEAR_ACCOUNT_ID;
  const privateKey = process.env.NEAR_PRIVATE_KEY;

  if (accountId && privateKey) {
    const { KeyPair } = require('near-api-js');
    const keyPair = KeyPair.fromString(privateKey);
    await keyStore.setKey(nearConfig.networkId, accountId, keyPair);
    const account = await near.account(accountId);
    console.log(`NEAR account loaded: ${accountId}`);
    return { near, account };
  } else {
    console.warn('NEAR_ACCOUNT_ID or NEAR_PRIVATE_KEY not set in .env. Running in read-only mode.');
    return { near, account: null };
  }
}

/**
 * Send NEAR tokens from the configured account to a recipient
 * @param {string} recipientId - NEAR account ID of the recipient
 * @param {string} amountNear - Amount in NEAR (e.g., "1.5")
 * @returns {Promise<{transactionHash: string, success: boolean}>}
 */
async function sendNear(recipientId, amountNear) {
  try {
    const { near, account } = await initNear();
    
    if (!account) {
      throw new Error('NEAR account not initialized. Please set NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY in .env');
    }

    // Convert NEAR to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    const amountYocto = utils.format.parseNearAmount(amountNear);

    // Send transaction
    const result = await account.sendMoney(recipientId, amountYocto);
    
    console.log(`Successfully sent ${amountNear} NEAR to ${recipientId}. Tx Hash: ${result.transaction.hash}`);
    return {
      transactionHash: result.transaction.hash,
      success: true
    };
  } catch (error) {
    console.error('Error sending NEAR transaction:', error.message);
    return {
      transactionHash: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Get account balance
 * @param {string} accountId - NEAR account ID
 * @returns {Promise<string>} Balance in NEAR
 */
async function getAccountBalance(accountId) {
  try {
    const { near } = await initNear();
    const account = await near.account(accountId);
    const balance = await account.getAccountBalance();
    return utils.format.formatNearAmount(balance.available);
  } catch (error) {
    console.error('Error fetching account balance:', error.message);
    return null;
  }
}

/**
 * Check connection to NEAR Testnet
 * @returns {Promise<{connected: boolean, networkId: string, latestBlockHeight: number}>}
 */
async function checkNearConnection() {
  try {
    const { near } = await initNear();
    const provider = near.connection.provider;
    const status = await provider.status();
    return {
      connected: true,
      networkId: nearConfig.networkId,
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

module.exports = {
  initNear,
  sendNear,
  getAccountBalance,
  checkNearConnection
};
