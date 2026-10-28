/**
 * Helper script to generate a NEAR Testnet account automatically
 * SpendGuard AI - NEAR Hackathon 2026
 */

const { KeyPair } = require('near-api-js');
const fs = require('fs');
const path = require('path');

async function createTestnetAccount() {
  try {
    // Generate a random account ID prefix
    const randomHex = Math.random().toString(36).substring(2, 8);
    const accountId = `spendguard-${randomHex}.testnet`;

    // Generate new key pair
    const keyPair = KeyPair.fromRandom('ed25519');
    const publicKey = keyPair.publicKey.toString();
    const privateKey = keyPair.secretKey;

    console.log(`Generating new NEAR Testnet account: ${accountId}...`);

    // Call NEAR Testnet Helper service to create and fund the account
    const response = await fetch('https://helper.testnet.near.org/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newAccountId: accountId,
        newAccountPublicKey: publicKey
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create account via NEAR testnet helper: ${errText}`);
    }

    console.log(`\n🎉 Success! Account created on NEAR Testnet: ${accountId}`);
    console.log(`Public Key:  ${publicKey}`);
    console.log(`Private Key: ${privateKey}`);

    // Update or create .env file automatically
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = `PORT=3000
NODE_ENV=development
NEAR_NETWORK=testnet
NEAR_NODE_URL=https://rpc.testnet.near.org
NEAR_ACCOUNT_ID=${accountId}
NEAR_PRIVATE_KEY=${privateKey}
`;

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`\n✅ Automatically updated backend/.env with your new account credentials!`);

  } catch (error) {
    console.error('Error creating NEAR Testnet account:', error.message);
  }
}

createTestnetAccount();
