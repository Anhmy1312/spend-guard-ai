# Project Backlog: SpendGuard AI

| Task ID | Task Name | Short Description | Difficulty | Estimate | Dependencies | MVP / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SETUP-01** | Initialize Workspace & Git | Create project directory, git init, folder structure, initial README.md. | Easy | 1 hour | None | **Required (MVP)** |
| **DB-01** | Initialize SQLite DB & Schema | Write script to initialize SQLite database (`rules`, `limits`, `proposals`, `logs`). | Medium | 2 hours | SETUP-01 | **Required (MVP)** |
| **BE-01** | Express Server & Rules API | Create Express server, connect SQLite, write CRUD API for safety rules & limits. | Medium | 3 hours | DB-01 | **Required (MVP)** |
| **AI-01** | AI Agent Simulator API | Build endpoint simulating AI Agent sending action requests (JSON payload: amount, description, recipient wallet). | Easy | 2 hours | BE-01 | **Required (MVP)** |
| **BE-02** | SpendGuard Core Engine | Write evaluation logic: match AI proposal against spending limits and safety rules. Auto-block or set to pending. | Hard | 4 hours | AI-01 | **Required (MVP)** |
| **NEAR-01** | NEAR Testnet Integration & API | Write module integrating `near-api-js` to connect to NEAR Testnet and handle signing/sending transactions upon approval. | Hard | 4 hours | BE-02 | **Required (MVP)** |
| **FE-01** | Dashboard UI (Tailwind) | Build HTML + Tailwind CSS interface (proposal list table, limit settings form, NEAR wallet status). | Medium | 4 hours | SETUP-01 | **Required (MVP)** |
| **FE-02** | Frontend & API/NEAR Integration | Write JavaScript to call Backend API, render data, handle Approve/Reject button events, connect NEAR wallet. | Medium | 4 hours | FE-01, NEAR-01 | **Required (MVP)** |
| **TEST-01** | Testing & Bug Fixing | Write test script or manually test scenarios: exceeding limits, within limits, approving Testnet transactions. | Medium | 3 hours | FE-02 | **Required (MVP)** |
| **DOC-01** | Documentation & Demo | Write detailed run instructions in README.md, record demo video, prepare submission. | Easy | 2 hours | TEST-01 | **Required (MVP)** |
