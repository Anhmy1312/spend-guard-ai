# Test Plan: SpendGuard AI

1. **Rule & Limit Testing:**
   - Test submitting an AI proposal exceeding the `max_amount` -> Expected: Proposal automatically marked as 'BLOCKED'.
   - Test submitting a proposal matching a blocked keyword pattern -> Expected: Blocked.
   - Test valid proposal within limits -> Expected: Marked as 'PENDING'.

2. **Blockchain Testing:**
   - Test approving a pending proposal via `near-api-js` -> Expected: Successful testnet transaction submission.

3. **UI Testing:**
   - Verify Tailwind CSS responsive design on proposal cards, rule settings form, and wallet status bar.
