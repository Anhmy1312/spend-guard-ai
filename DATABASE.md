# Database Schema (SQLite)

1. **rules**
   - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
   - `name` (TEXT)
   - `pattern` (TEXT)
   - `action` (TEXT) -- 'ALLOW' or 'BLOCK'
   - `created_at` (DATETIME)

2. **limits**
   - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
   - `type` (TEXT) -- 'DAILY' or 'PER_TX'
   - `max_amount` (REAL)
   - `current_spent` (REAL)
   - `updated_at` (DATETIME)

3. **proposals**
   - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
   - `agent_id` (TEXT)
   - `amount` (REAL)
   - `recipient` (TEXT)
   - `description` (TEXT)
   - `status` (TEXT) -- 'PENDING', 'APPROVED', or 'BLOCKED'
   - `tx_hash` (TEXT) -- NEAR transaction hash (nullable)
   - `created_at` (DATETIME)

4. **logs**
   - `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
   - `proposal_id` (INTEGER)
   - `message` (TEXT)
   - `timestamp` (DATETIME)
