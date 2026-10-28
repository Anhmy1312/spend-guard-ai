/**
 * SpendGuard AI - Express Backend Server
 * NEAR Hackathon 2026
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpendGuard AI Backend is running successfully.' });
});

/**
 * =====================
 * RULES API ENDPOINTS
 * =====================
 */

// Get all safety rules
app.get('/api/rules', (req, res) => {
  const query = `SELECT * FROM rules ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ rules: rows });
  });
});

// Add a new safety rule
app.post('/api/rules', (req, res) => {
  const { name, pattern, action } = req.body;

  if (!name || !pattern || !action) {
    return res.status(400).json({ error: 'Missing required fields: name, pattern, action' });
  }

  if (!['ALLOW', 'BLOCK'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be either ALLOW or BLOCK' });
  }

  const query = `INSERT INTO rules (name, pattern, action) VALUES (?, ?, ?)`;
  db.run(query, [name, pattern, action], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Rule created successfully',
      ruleId: this.lastID
    });
  });
});

/**
 * =====================
 * LIMITS API ENDPOINTS
 * =====================
 */

// Get all spending limits
app.get('/api/limits', (req, res) => {
  const query = `SELECT * FROM limits`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ limits: rows });
  });
});

// Update spending limit
app.put('/api/limits/:id', (req, res) => {
  const { id } = req.params;
  const { max_amount } = req.body;

  if (max_amount === undefined || typeof max_amount !== 'number') {
    return res.status(400).json({ error: 'Valid max_amount (number) is required' });
  }

  const query = `UPDATE limits SET max_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [max_amount, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Limit not found' });
    }
    res.json({ message: 'Limit updated successfully' });
  });
});

/**
 * ==========================================
 * AI AGENT SIMULATOR & SPENDGUARD ENGINE API
 * ==========================================
 */

// Get all proposals
app.get('/api/proposals', (req, res) => {
  const query = `SELECT * FROM proposals ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ proposals: rows });
  });
});

// Simulate AI Agent Action Proposal & Evaluate against SpendGuard Rules & Limits
app.post('/api/proposals/simulate', (req, res) => {
  const { agent_id, amount, recipient, description } = req.body;

  if (!agent_id || amount === undefined || !recipient) {
    return res.status(400).json({ error: 'Missing required fields: agent_id, amount, recipient' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // 1. Fetch safety rules and limits from database
  db.all(`SELECT * FROM rules`, [], (err, rules) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(`SELECT * FROM limits`, [], (err, limits) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      let status = 'PENDING'; // Default status waiting for approval
      let evaluationMessage = 'Proposal passed initial checks and is pending user approval.';

      // 2. Evaluate against safety rules (e.g. blocked recipient patterns)
      for (const rule of rules) {
        if (rule.action === 'BLOCK' && recipient.includes(rule.pattern)) {
          status = 'BLOCKED';
          evaluationMessage = `Blocked by safety rule: "${rule.name}" (matched pattern: ${rule.pattern})`;
          break;
        }
      }

      // 3. Evaluate against spending limits if not already blocked
      if (status !== 'BLOCKED') {
        const perTxLimit = limits.find(l => l.type === 'PER_TX');
        const dailyLimit = limits.find(l => l.type === 'DAILY');

        if (perTxLimit && amount > perTxLimit.max_amount) {
          status = 'BLOCKED';
          evaluationMessage = `Blocked: Amount (${amount} NEAR) exceeds per-transaction limit (${perTxLimit.max_amount} NEAR).`;
        } else if (dailyLimit && (dailyLimit.current_spent + amount) > dailyLimit.max_amount) {
          status = 'BLOCKED';
          evaluationMessage = `Blocked: Cumulative daily spending would exceed daily limit (${dailyLimit.max_amount} NEAR).`;
        }
      }

      // 4. Insert proposal into database
      const insertProposalQuery = `INSERT INTO proposals (agent_id, amount, recipient, description, status) VALUES (?, ?, ?, ?, ?)`;
      db.run(insertProposalQuery, [agent_id, amount, recipient, description || '', status], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const proposalId = this.lastID;

        // 5. Log evaluation result
        db.run(`INSERT INTO logs (proposal_id, message) VALUES (?, ?)`, [proposalId, evaluationMessage], (logErr) => {
          if (logErr) {
            console.error('Error saving log:', logErr.message);
          }
        });

        res.status(201).json({
          message: 'AI action proposal simulated and evaluated successfully',
          proposal: {
            id: proposalId,
            agent_id,
            amount,
            recipient,
            description,
            status
          },
          evaluation: {
            result: status,
            reason: evaluationMessage
          }
        });
      });
    });
  });
});

// Check NEAR Testnet connection status
app.get('/api/near/status', async (req, res) => {
  const { checkNearConnection } = require('./near');
  const status = await checkNearConnection();
  res.json(status);
});

/**
 * =====================
 * NEAR TRANSACTION APPROVAL ENDPOINT
 * =====================
 */

// Approve a pending proposal and execute NEAR transaction
app.post('/api/proposals/:id/approve', async (req, res) => {
  const { id } = req.params;

  // 1. Fetch proposal from database
  db.get(`SELECT * FROM proposals WHERE id = ?`, [id], async (err, proposal) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    if (proposal.status !== 'PENDING') {
      return res.status(400).json({ error: `Proposal is already ${proposal.status}. Only PENDING proposals can be approved.` });
    }

    try {
      // 2. Execute NEAR transaction
      const { sendNear } = require('./near');
      const result = await sendNear(proposal.recipient, proposal.amount.toString());

      if (result.success) {
        // 3. Update proposal status to APPROVED
        db.run(`UPDATE proposals SET status = 'APPROVED', tx_hash = ? WHERE id = ?`, [result.transactionHash, id], function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // 4. Log success
          db.run(`INSERT INTO logs (proposal_id, message) VALUES (?, ?)`,
            [id, `Transaction approved and sent. Tx Hash: ${result.transactionHash}`],
            (logErr) => {
              if (logErr) console.error('Error saving log:', logErr.message);
            }
          );

          res.json({
            message: 'Proposal approved and NEAR transaction sent successfully',
            proposalId: id,
            status: 'APPROVED',
            transactionHash: result.transactionHash,
            explorerUrl: `https://explorer.testnet.near.org/transactions/${result.transactionHash}`
          });
        });
      } else {
        // Transaction failed
        db.run(`INSERT INTO logs (proposal_id, message) VALUES (?, ?)`,
          [id, `Transaction failed: ${result.error}`],
          (logErr) => {
            if (logErr) console.error('Error saving log:', logErr.message);
          }
        );

        res.status(500).json({
          message: 'NEAR transaction failed',
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * =====================
 * REJECT PROPOSAL ENDPOINT
 * =====================
 */

// Reject a pending proposal (no blockchain transaction)
app.post('/api/proposals/:id/reject', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM proposals WHERE id = ?`, [id], (err, proposal) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    if (proposal.status !== 'PENDING') {
      return res.status(400).json({ error: `Proposal is already ${proposal.status}. Only PENDING proposals can be rejected.` });
    }

    db.run(`UPDATE proposals SET status = 'BLOCKED' WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run(`INSERT INTO logs (proposal_id, message) VALUES (?, ?)`,
        [id, 'Proposal rejected by user. No blockchain transaction executed.'],
        (logErr) => {
          if (logErr) console.error('Error saving log:', logErr.message);
        }
      );

      res.json({
        message: 'Proposal rejected successfully',
        proposalId: id,
        status: 'BLOCKED'
      });
    });
  });
});

/**
 * =====================
 * RESET DAILY LIMIT ENDPOINT
 * =====================
 */

// Reset daily spending limit (for testing/demo purposes)
app.post('/api/limits/reset', (req, res) => {
  db.run(`UPDATE limits SET current_spent = 0, updated_at = CURRENT_TIMESTAMP WHERE type = 'DAILY'`, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Daily limit not found' });
    }

    db.run(`INSERT INTO logs (proposal_id, message) VALUES (NULL, 'Daily spending limit has been reset to 0.')`, (logErr) => {
      if (logErr) console.error('Error saving log:', logErr.message);
    });

    res.json({ message: 'Daily spending limit reset successfully' });
  });
});

/**
 * =====================
 * STATISTICS & EXPORT ENDPOINTS
 * =====================
 */

// Get spending statistics for chart
app.get('/api/stats', (req, res) => {
  const query = `
    SELECT 
      DATE(created_at) as date,
      SUM(amount) as total_spent,
      COUNT(*) as proposal_count
    FROM proposals 
    WHERE status = 'APPROVED'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
    LIMIT 7
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ stats: rows });
  });
});

// Export logs to CSV
app.get('/api/logs/export', (req, res) => {
  const query = `
    SELECT 
      l.timestamp,
      l.proposal_id,
      p.agent_id,
      p.amount,
      p.recipient,
      p.status,
      l.message
    FROM logs l
    LEFT JOIN proposals p ON l.proposal_id = p.id
    ORDER BY l.timestamp DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Build CSV
    const headers = ['Timestamp', 'Proposal ID', 'Agent ID', 'Amount (NEAR)', 'Recipient', 'Status', 'Message'];
    const csvRows = [headers.join(',')];
    
    rows.forEach(row => {
      const values = [
        `"${row.timestamp || ''}"`,
        row.proposal_id || '',
        `"${row.agent_id || ''}"`,
        row.amount || 0,
        `"${row.recipient || ''}"`,
        `"${row.status || ''}"`,
        `"${(row.message || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const csv = csvRows.join('\\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=spendguard-logs.csv');
    res.send(csv);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SpendGuard AI backend server is running on port ${PORT}`);
});
