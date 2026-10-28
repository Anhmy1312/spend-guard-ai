# SpendGuard AI

> **Control AI Agent proposed actions through spending limits, safety rules, and activity history on NEAR.**
> Project submitted to **NEAR Hackathon 2026** (Nov 1 – Nov 14, 2026).

---

## 📋 Table of Contents

- [Overview](#overview)
- [MVP Features](#mvp-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Endpoints](#api-endpoints)
- [NEAR Testnet Integration](#near-testnet-integration)
- [Testing](#testing)
- [Hackathon Submission Checklist](#hackathon-submission-checklist)

---

## Overview

**SpendGuard AI** is an intelligent safety and spending control layer for AI Agents (Autonomous Agents). When an AI Agent proposes to perform a financial action or transaction, SpendGuard AI will:

1. **Intercept** the request and evaluate it against **safety rules** and **spending limits**.
2. **Automatically reject** if it violates rules or exceeds limits.
3. **Require user approval** if the proposal is valid.
4. **Sign and submit the transaction** on NEAR Testnet when the user clicks "Approve".

---

## MVP Features

- ✅ **Safety Rule Management** — Add/view rules (e.g., block addresses containing `scam.testnet`).
- ✅ **Spending Limits** — Daily limit (10 NEAR) and Per-TX limit (3 NEAR) with progress bars.
- ✅ **AI Agent Simulator** — Simulate AI Agent proposing actions (amount, recipient, description).
- ✅ **SpendGuard Engine** — Automatically evaluate proposals against rules and limits.
- ✅ **NEAR Testnet Integration** — Sign and send real NEAR transactions upon approval.
- ✅ **Dashboard UI** — Modern, responsive Tailwind CSS interface with auto-refresh.
- ✅ **Audit Logging** — Record evaluation and transaction history in SQLite.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS (CDN), Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite (sqlite3) |
| Blockchain | NEAR Protocol (near-api-js, Testnet) |
| Testing | Node.js HTTP Test Script |

---

## Project Structure

```text
spend-guard-ai/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server & API endpoints
│   │   ├── db.js              # SQLite connection & schema init
│   │   ├── near.js            # NEAR Testnet integration (near-api-js)
│   │   ├── nearService.js     # NEAR connection helper
│   │   ├── create-account.js  # Auto-create NEAR Testnet account
│   │   └── test.js            # Automated test suite (12 tests)
│   ├── package.json
│   ├── .env                   # Environment variables (NEAR credentials)
│   └── .env.example           # Environment variable template
├── frontend/
│   └── index.html             # Dashboard UI (Tailwind CSS)
├── PLAN.md                    # Project plan
├── TASKS.md                   # Project backlog
├── ARCHITECTURE.md            # Architecture documentation
├── DATABASE.md                # Database schema
├── TEST_PLAN.md               # Test plan
└── README.md                  # This file
```

---

## Installation & Setup

### Prerequisites
- **Node.js** v18+ (recommended v20+)
- **npm** (included with Node.js)

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/spend-guard-ai.git
cd spend-guard-ai
```

### Step 2: Install dependencies
```bash
cd backend
npm install
```

### Step 3: Create a NEAR Testnet account (optional)
If you don't have a NEAR Testnet account yet, run the auto-creation script:
```bash
node src/create-account.js
```
The script will automatically create an account and update the `.env` file.

Or create one manually at https://wallet.testnet.near.org/ and fill in the `.env` file:
```env
PORT=3000
NODE_ENV=development
NEAR_NETWORK=testnet
NEAR_NODE_URL=https://rpc.testnet.near.org
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_PRIVATE_KEY=ed25519:your-private-key-here
```

### Step 4: Start the server
```bash
npm start
```
Or:
```bash
node src/server.js
```
Server will run at: **http://localhost:3000**

### Step 5: Open the Dashboard
Open your browser and navigate to: **http://localhost:3000**

---

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check if server is running |

### Rules (Safety Rules)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rules` | Get all safety rules |
| `POST` | `/api/rules` | Add a new safety rule |

**POST /api/rules** — Body:
```json
{
  "name": "Block scam addresses",
  "pattern": "scam.testnet",
  "action": "BLOCK"
}
```

### Limits (Spending Limits)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/limits` | Get all spending limits |
| `PUT` | `/api/limits/:id` | Update a spending limit |

### Proposals (AI Agent Proposals)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/proposals` | Get all proposals |
| `POST` | `/api/proposals/simulate` | Simulate an AI Agent proposal |
| `POST` | `/api/proposals/:id/approve` | Approve and send NEAR transaction |

**POST /api/proposals/simulate** — Body:
```json
{
  "agent_id": "ai-agent-alpha",
  "amount": 1.0,
  "recipient": "alice.testnet",
  "description": "Payment for compute service"
}
```

**Response:**
```json
{
  "message": "AI action proposal simulated and evaluated successfully",
  "proposal": { "id": 1, "agent_id": "ai-agent-alpha", "amount": 1.0, "recipient": "alice.testnet", "status": "PENDING" },
  "evaluation": { "result": "PENDING", "reason": "Proposal passed initial checks and is pending user approval." }
}
```

### NEAR Testnet
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/near/status` | Check NEAR Testnet connection status |

---

## NEAR Testnet Integration

- **Network:** NEAR Testnet (`testnet`)
- **Library:** `near-api-js` v3.x
- **RPC URL:** `https://rpc.testnet.near.org`
- **Explorer:** `https://explorer.testnet.near.org`
- **Transaction Flow:**
  1. AI Agent submits proposal → SpendGuard Engine evaluates.
  2. If valid → Status set to `PENDING`.
  3. User clicks "Approve & Send" → Backend signs transaction using `near-api-js`.
  4. Transaction is sent on NEAR Testnet → Status set to `APPROVED`.
  5. Tx Hash is returned and displayed with Explorer link.

---

## Testing

### Run automated test suite
```bash
cd backend
node src/test.js
```

### Test Results (12/12 PASSED)
| # | Test Case | Result |
|---|---|---|
| 1 | Health Check | ✅ PASS |
| 2 | Get Spending Limits | ✅ PASS |
| 3 | Get Safety Rules | ✅ PASS |
| 4 | Simulate Valid Proposal (PENDING) | ✅ PASS |
| 5 | Simulate Blocked Proposal (exceeds limit) | ✅ PASS |
| 6 | Simulate Blocked Proposal (scam recipient) | ✅ PASS |
| 7 | Get All Proposals | ✅ PASS |
| 8 | Approve Proposal (NEAR TX) | ✅ PASS |
| 9 | Re-approve Rejected | ✅ PASS |
| 10 | Non-existent Proposal (404) | ✅ PASS |
| 11 | NEAR Testnet Connection | ✅ PASS |
| 12 | Invalid Request Body (400) | ✅ PASS |

---

## Hackathon Submission Checklist

- [x] Completed public source code on GitHub (Public repository)
- [x] Tested scenario: AI Agent sends request exceeding limit → SpendGuard automatically blocks
- [x] Tested scenario: AI Agent sends valid request → User approves → Testnet transaction signed successfully
- [x] README with complete installation and run instructions
- [ ] Record product demo video (under 2 minutes)
- [ ] Post on X (Twitter) with demo video and hashtags per hackathon rules
- [ ] Submit official entry form before Nov 14, 2026 · 23:59 UTC

---

## Submission Info

- **Project Name:** SpendGuard AI
- **Track:** AI & Agents / Autonomous Payments
- **Hackathon:** NEAR Hackathon 2026 (Nov 1 – Nov 14, 2026)
- **Developer:** Solo student developer
- **Repository:** https://github.com/your-username/spend-guard-ai

---

## Security Notes

- **NEVER** commit Private Keys, Seed Phrases, or API Keys to a public repository.
- The `.env` file is included in `.gitignore`.
- Only NEAR Testnet is used for demo, not Mainnet.

---

*Built with ❤️ for NEAR Hackathon 2026*
