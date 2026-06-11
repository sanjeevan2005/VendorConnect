# VendorConnect

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)

**VendorConnect** is an enterprise-grade, AI-powered hardware procurement platform. It streamlines the sourcing lifecycle by intelligently parsing Requests for Quotation (RFQs), autonomously discovering ideal vendors, triggering AI voice qualification calls, and synthesizing actionable quotes within a single pane of glass.

---

## Key Capabilities

- **Intelligent RFQ Parsing:** Extracts unstructured engineering constraints (tolerances, materials) and converts them into structured RFQ datasets.
- **Autonomous Discovery:** Integrates directly with Crust Data to intelligently crawl and rank suppliers by fit, headcount, and specialty.
- **AI Voice Agents:** Dispatches real-time, interactive phone calls to vendor POCs using Vapi.ai and Anthropic Claude, qualifying capabilities and negotiating lead times.
- **Unified Dashboard:** Real-time metrics, interactive transcripts, and competitive quote comparisons—all presented in a high-fidelity, responsive UI.

## Architecture & Security

VendorConnect employs a strict **Zero-Trust Architecture**:
- **Frontend (`apps/web`):** A lightweight Next.js client completely decoupled from the database. It communicates exclusively via secure, rate-limited REST endpoints.
- **Backend (`apps/api`):** A robust FastAPI proxy layer that orchestrates all LLM logic, external API integrations, and database interactions. Secured with configurable API Key middleware to prevent unauthorized access and Denial-of-Wallet attacks.
- **Data Layer:** PostgreSQL (via Supabase) heavily restricted by RLS, accessible only via secure service-role keys at the backend layer.

---

## Getting Started

### Prerequisites
- **Node.js** (v20+ LTS)
- **Python** (v3.12+)
- **Supabase CLI** (for local development)

### 1. Environment Configuration

Clone the repository and set up your environment variables based on the provided templates.

**Frontend:**
```bash
cp apps/web/.env.local.example apps/web/.env.local
```
*Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_KEY`.*

**Backend:**
```bash
cp apps/api/.env.example apps/api/.env
```
*Configure your Supabase credentials, `API_KEY`, `ANTHROPIC_API_KEY`, `CRUST_DATA_API_KEY`, and `VAPI_API_KEY`.*

### 2. Run Locally

We provide PowerShell wrappers for a streamlined startup experience on Windows environments.

**Start the FastAPI Backend:**
```powershell
powershell -ExecutionPolicy Bypass -File .\run-backend.ps1
```

**Start the Next.js Frontend:**
```powershell
powershell -ExecutionPolicy Bypass -File .\run-frontend.ps1
```

The application will be accessible at `http://localhost:3000`.

---

## Code Quality & Verification

The codebase adheres strictly to enterprise code-quality standards.

**Frontend Verification:**
```bash
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

**Backend Verification:**
```bash
# Handled via Ruff & Pytest
python -m ruff check apps/api/
python -m ruff format apps/api/
python -m pytest apps/api/tests/
```

---

*For any internal deployments, ensure `WEBHOOK_URL` is securely tunneled (e.g., via ngrok) to receive real-time updates from Vapi.*
