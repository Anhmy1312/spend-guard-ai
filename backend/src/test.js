/**
 * Automated Test Script for SpendGuard AI
 * NEAR Hackathon 2026
 * Tests all critical API endpoints and business logic.
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('  SpendGuard AI - Automated Test Suite');
  console.log('========================================\n');

  // Test 1: Health Check
  console.log('Test 1: Health Check...');
  const health = await request('GET', '/health');
  if (health.status === 200 && health.data.status === 'ok') {
    console.log('  ✅ PASS - Server is running\n');
    passed++;
  } else {
    console.log('  ❌ FAIL - Server health check failed\n');
    failed++;
  }

  // Test 2: Get Limits
  console.log('Test 2: Get Spending Limits...');
  const limits = await request('GET', '/api/limits');
  if (limits.status === 200 && limits.data.limits && limits.data.limits.length >= 2) {
    console.log(`  ✅ PASS - Found ${limits.data.limits.length} limits\n`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Could not fetch limits\n');
    failed++;
  }

  // Test 3: Get Rules
  console.log('Test 3: Get Safety Rules...');
  const rules = await request('GET', '/api/rules');
  if (rules.status === 200 && rules.data.rules && rules.data.rules.length >= 1) {
    console.log(`  ✅ PASS - Found ${rules.data.rules.length} rules\n`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Could not fetch rules\n');
    failed++;
  }

  // Test 4: Simulate Valid Proposal (within limits)
  console.log('Test 4: Simulate Valid Proposal (1.0 NEAR)...');
  const validProposal = await request('POST', '/api/proposals/simulate', {
    agent_id: 'test-agent',
    amount: 0.1,
    recipient: 'alice.testnet',
    description: 'Test valid proposal'
  });
  if (validProposal.status === 201 && validProposal.data.evaluation.result === 'PENDING') {
    console.log(`  ✅ PASS - Proposal created with status PENDING (ID: ${validProposal.data.proposal.id})\n`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected PENDING, got: ${validProposal.data?.evaluation?.result}\n`);
    failed++;
  }

  // Test 5: Simulate Blocked Proposal (exceeds per-tx limit)
  console.log('Test 5: Simulate Blocked Proposal (5.0 NEAR - exceeds per-tx limit)...');
  const blockedProposal = await request('POST', '/api/proposals/simulate', {
    agent_id: 'test-agent',
    amount: 5.0,
    recipient: 'bob.testnet',
    description: 'Test blocked proposal - exceeds limit'
  });
  if (blockedProposal.status === 201 && blockedProposal.data.evaluation.result === 'BLOCKED') {
    console.log(`  ✅ PASS - Proposal blocked (Reason: ${blockedProposal.data.evaluation.reason})\n`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected BLOCKED, got: ${blockedProposal.data?.evaluation?.result}\n`);
    failed++;
  }

  // Test 6: Simulate Blocked Proposal (scam recipient)
  console.log('Test 6: Simulate Blocked Proposal (scam.testnet recipient)...');
  const scamProposal = await request('POST', '/api/proposals/simulate', {
    agent_id: 'test-agent',
    amount: 0.5,
    recipient: 'scam.testnet',
    description: 'Test scam recipient block'
  });
  if (scamProposal.status === 201 && scamProposal.data.evaluation.result === 'BLOCKED') {
    console.log(`  ✅ PASS - Scam recipient blocked (Reason: ${scamProposal.data.evaluation.reason})\n`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected BLOCKED for scam recipient\n`);
    failed++;
  }

  // Test 7: Get All Proposals
  console.log('Test 7: Get All Proposals...');
  const allProposals = await request('GET', '/api/proposals');
  if (allProposals.status === 200 && allProposals.data.proposals && allProposals.data.proposals.length >= 3) {
    console.log(`  ✅ PASS - Found ${allProposals.data.proposals.length} proposals\n`);
    passed++;
  } else {
    console.log('  ❌ FAIL - Could not fetch proposals\n');
    failed++;
  }

  // Test 8: Approve a PENDING Proposal (NEAR Testnet Transaction)
  const pendingId = validProposal.data?.proposal?.id;
  if (pendingId) {
    console.log(`Test 8: Approve Proposal #${pendingId} (NEAR Testnet Transaction)...`);
    const approve = await request('POST', `/api/proposals/${pendingId}/approve`);
    if (approve.status === 200 && approve.data.status === 'APPROVED') {
      console.log(`  ✅ PASS - Proposal approved. Tx Hash: ${approve.data.transactionHash}`);
      console.log(`  Explorer: ${approve.data.explorerUrl}\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Approval failed: ${approve.data?.error || approve.data?.message}\n`);
      failed++;
    }
  } else {
    console.log('Test 8: Skipped (no pending proposal ID)\n');
  }

  // Test 9: Try to approve already approved proposal
  if (pendingId) {
    console.log(`Test 9: Try to re-approve Proposal #${pendingId}...`);
    const reapprove = await request('POST', `/api/proposals/${pendingId}/approve`);
    if (reapprove.status === 400) {
      console.log('  ✅ PASS - Correctly rejected re-approval\n');
      passed++;
    } else {
      console.log('  ❌ FAIL - Should have rejected re-approval\n');
      failed++;
    }
  }

  // Test 10: Try to approve non-existent proposal
  console.log('Test 10: Approve non-existent proposal (ID: 99999)...');
  const nonExistent = await request('POST', '/api/proposals/99999/approve');
  if (nonExistent.status === 404) {
    console.log('  ✅ PASS - Correctly returned 404 for non-existent proposal\n');
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 404\n');
    failed++;
  }

  // Test 11: NEAR Status
  console.log('Test 11: NEAR Testnet Connection Status...');
  const nearStatus = await request('GET', '/api/near/status');
  if (nearStatus.status === 200 && nearStatus.data.connected) {
    console.log(`  ✅ PASS - Connected to NEAR Testnet (Block: ${nearStatus.data.latestBlockHeight})\n`);
    passed++;
  } else {
    console.log('  ❌ FAIL - NEAR connection failed\n');
    failed++;
  }

  // Test 12: Invalid request body
  console.log('Test 12: Simulate with missing fields...');
  const invalid = await request('POST', '/api/proposals/simulate', { agent_id: 'test' });
  if (invalid.status === 400) {
    console.log('  ✅ PASS - Correctly rejected invalid request\n');
    passed++;
  } else {
    console.log('  ❌ FAIL - Expected 400 for invalid request\n');
    failed++;
  }

  // Summary
  console.log('========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('========================================');

  if (failed === 0) {
    console.log('\n🎉 All tests passed! SpendGuard AI is ready for demo.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
