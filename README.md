# Algo-Cert Academy

> **Decentralized Skill Verification Platform**  
> Secure, tamper-proof on-chain credential issuance powered by Algorand and IPFS.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Smart Contracts](#smart-contracts)
- [API Integration](#api-integration)
- [Security & Anti-Cheat](#security--anti-cheat)
- [Certificate Generation & Minting](#certificate-generation--minting)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Algo-Cert Academy** is a decentralized application (dApp) that bridges secure skill assessment with on-chain credential verification. It combines:

- **Client-Side Code Execution & Grading**: Real-time Python code evaluation against test cases.
- **AI-Powered Assessment**: Integration with Google Gemini API for intelligent code review and scoring.
- **Multi-Layer Anti-Cheat System**: Browser APIs (Fullscreen, Visibility State), keystroke dynamics, and session monitoring.
- **Decentralized Credential Storage**: IPFS via Pinata for immutable certificate metadata and images.
- **NFT Minting**: Automatic creation of Algorand Standard Assets (ASA) following ARC-3 standards.
- **Wallet Integration**: Seamless connection via Pera Wallet, Defly, and other Algorand wallets.

Students submit code solutions, receive AI feedback, and upon passing—automatically receive a verifiable digital certificate minted as an NFT on the Algorand blockchain. This proof of skill is portable, verifiable, and permanently recorded.

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Authentication (Wallet Connect)                    │ │
│  │  2. Exam Submission (Monaco Editor)                    │ │
│  │  3. Anti-Cheat Monitors (Fullscreen, Keystroke)       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼─────┐              ┌───────▼────┐
   │ Gemini   │              │   IPFS     │
   │ API      │              │  (Pinata)  │
   │ (Grade)  │              │ (Upload)   │
   └────┬─────┘              └───────┬────┘
        │                            │
        └──────────────┬─────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   Smart Contracts (Python)  │
        │  ┌──────────────────────┐   │
        │  │ Counter / Bank / etc │   │
        │  └──────────────────────┘   │
        └─────────────┬────────────────┘
                      │
        ┌─────────────▼───────────────┐
        │ Algorand Testnet / Mainnet  │
        │ (ASA Minting, Transaction)  │
        └─────────────────────────────┘
```

### Component Breakdown

1. **Frontend (React + Vite)**
   - Entry point: `src/main.tsx`
   - Main app router: `src/App.tsx`, `src/Home.tsx`
   - Core exam components: `ExamRoom.tsx`, `DevDuel.tsx`
   - Wallet integration: `ConnectWallet.tsx`, `Account.tsx`

2. **Exam Engine**
   - `utils/gradeExam.ts`: Gemini API integration for code grading
   - `utils/keystrokeAnalyzer.ts`: Keystroke pattern analysis for trust scoring
   - `hooks/useKeystrokeMonitor.ts`: Real-time keystroke event monitoring
   - `hooks/useAntiCheat.ts`: Session integrity enforcement

3. **Certificate & Storage**
   - `utils/generateCertificate.ts`: Canvas-based certificate rendering
   - `utils/pinata.ts`: IPFS pinning and file upload operations
   - `utils/nftMetadata.ts`: ARC-3 compliant metadata generation

4. **Smart Contracts** (Python + AlgoKit)
   - `projects/contracts/smart_contracts/counter/`: Counter contract example
   - `projects/contracts/smart_contracts/bank/`: Bank contract example
   - Auto-generated client SDKs in `artifacts/`

5. **Wallet & Transactions**
   - `utils/payExamFee.ts`: Fee payment transaction
   - `utils/optIn.ts`: Token opt-in operations
   - `utils/mintGradeNFT.ts`: ASA creation and minting

---

## Key Features

### 🔐 Multi-Layer Security

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Session Integrity** | Fullscreen enforcement | Prevents alt-tab and overlays |
| **Visibility Monitoring** | Document visibility API | Detects tab switching |
| **Keystroke Dynamics** | Typing pattern analysis | Flags bot-like speeds (>180 WPM) |
| **Clipboard Tracking** | Internal vs. external paste detection | Distinguishes legit vs. copied code |
| **Network Monitoring** | Browser blur/focus events | Detects extension popups |

### 🎯 Intelligent Grading

- **Gemini AI Integration**: Real-time code evaluation with reasoning
- **Configurable Models**: Support for `gemini-1.5`, `gemini-2.0-flash`, etc.
- **Robust JSON Parsing**: Handles markdown-wrapped and malformed responses
- **Graceful Fallback**: Simulated grading if API quota exceeded

### ✨ Certificate Generation

- **Canvas Rendering**: Ornate, high-resolution certificate design
- **Dynamic Data**: Student name, score, date, and trust metrics embedded
- **Dual Output**: Preview URL (fast) + File object (for IPFS upload)

### 🔗 Blockchain Integration

- **ARC-3 Metadata Standard**: Fully compliant NFT metadata
- **IPFS Storage**: Immutable certificate images and metadata via Pinata
- **One-Click Minting**: ASA creation and transfer in a single transaction
- **Multi-Wallet Support**: Pera, Defly, Lute, and others

---

## Technology Stack

### Frontend
- **Framework**: React 18.2 + TypeScript
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS + DaisyUI
- **Editor**: Monaco Editor (VS Code compatible)
- **State Management**: React Hooks + Context API

### Blockchain
- **Network**: Algorand (Testnet/Mainnet)
- **SDK**: algosdk 3.x + algokit-utils 9.x
- **Smart Contracts**: PyTeal (Python-based)
- **Storage**: IPFS (Pinata API)

### AI & Services
- **Code Grading**: Google Gemini API
- **Clipboard Detection**: Clipboard API
- **Canvas Rendering**: HTML5 Canvas API

### Tooling
- **Package Manager**: NPM 9+
- **Node.js**: 20+
- **Testing**: Jest, Playwright
- **Linting**: ESLint + Prettier
- **Build**: TypeScript, Vite, Tailwind PostCSS

---

## Project Structure

```
Hackathon-QuickStart-template/
├── projects/
│   ├── frontend/                          # React + Vite frontend
│   │   ├── public/                        # Static assets
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ExamRoom.tsx           # Main exam interface
│   │   │   │   ├── DevDuel.tsx            # Competitive exam mode
│   │   │   │   ├── ConnectWallet.tsx      # Wallet authentication
│   │   │   │   ├── Account.tsx            # User account display
│   │   │   │   ├── Bank.tsx               # Bank contract UI
│   │   │   │   ├── Counter.tsx            # Counter contract UI
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   ├── useKeystrokeMonitor.ts # Keystroke tracking
│   │   │   │   ├── useAntiCheat.ts        # Anti-cheat enforcement
│   │   │   │   └── ...
│   │   │   ├── utils/
│   │   │   │   ├── gradeExam.ts           # Gemini API integration
│   │   │   │   ├── generateCertificate.ts # Canvas certificate rendering
│   │   │   │   ├── pinata.ts              # IPFS pinning
│   │   │   │   ├── keystrokeAnalyzer.ts   # Keystroke analysis
│   │   │   │   ├── mintGradeNFT.ts        # NFT minting logic
│   │   │   │   ├── optIn.ts               # Token opt-in
│   │   │   │   ├── nftMetadata.ts         # ARC-3 metadata
│   │   │   │   └── network/
│   │   │   │       └── getAlgoClientConfigs.ts
│   │   │   ├── interfaces/
│   │   │   │   └── network.ts             # Type definitions
│   │   │   ├── styles/
│   │   │   │   └── main.css               # Global styles
│   │   │   ├── App.tsx                    # Main app router
│   │   │   ├── main.tsx                   # React entry point
│   │   │   └── vite-env.d.ts              # Vite type definitions
│   │   ├── .env.example                   # Environment variables template
│   │   ├── vite.config.ts                 # Vite configuration
│   │   ├── tsconfig.json                  # TypeScript configuration
│   │   ├── tailwind.config.cjs            # Tailwind config
│   │   └── package.json
│   │
│   └── contracts/                         # Python smart contracts
│       ├── smart_contracts/
│       │   ├── counter/
│       │   │   ├── contract.py            # Counter contract
│       │   │   └── deploy_config.py
│       │   ├── bank/
│       │   │   ├── contract.py            # Bank contract
│       │   │   └── deploy_config.py
│       │   ├── team_vault/
│       │   ├── tutor_escrow/
│       │   └── artifacts/                 # Generated client SDKs
│       ├── tests/
│       │   ├── counter_test.py
│       │   └── counter_client_test.py
│       ├── pyproject.toml
│       └── poetry.toml
│
├── .algokit/
├── .algokit.toml                          # AlgoKit config
├── Alokit_setup.md                        # Setup guide
├── OnChain-Counter.code-workspace         # VS Code workspace
├── package.json                           # Root package.json
└── README.md                              # This file
```

---

## Prerequisites

- **Node.js**: v20+ ([download](https://nodejs.org/))
- **npm**: v9+ (included with Node.js)
- **Python**: 3.11+ (for smart contracts)
- **AlgoKit**: Latest ([install](https://github.com/algorandfoundation/algokit-cli))
- **Algorand Wallet**: Pera or Defly wallet with testnet ALGO tokens
- **Google Gemini API Key**: Free tier available ([get key](https://ai.google.dev/))
- **Pinata API Key**: For IPFS uploads ([get key](https://pinata.cloud/))

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hackathon-QuickStart-template
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd projects/frontend
npm install
```

### 4. Install Smart Contract Dependencies (Optional)

```bash
cd ../../projects/contracts
poetry install
```

Or using pip:
```bash
pip install -r requirements.txt
```

---

## Configuration

### Frontend Environment Variables

Create a `.env` file in `projects/frontend/`:

```env
# Algorand Network
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=443
VITE_ALGOD_TOKEN=
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=443
VITE_INDEXER_TOKEN=

# AI Grading
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-1.5

# Student Info (Optional)
VITE_STUDENT_NAME="Your Name Here"

# IPFS / Pinata Storage
VITE_PINATA_JWT=your_pinata_jwt_here

# Network Environment
VITE_NETWORK=testnet
```

### AlgoKit Configuration

Verify `.algokit.toml`:

```toml
[algokit]
min_version = "2.0.0"
```

---

## Running the Application

### Start the Algorand LocalNet (Optional for Testing)

```bash
algokit localnet start
```

### Start the Frontend Development Server

```bash
cd projects/frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

### Lint & Format Code

```bash
npm run lint
npm run lint:fix
```

---

## Smart Contracts

### Deploying Contracts

```bash
cd projects/contracts
algokit deploy localnet  # or testnet, mainnet
```

### Contract Files

- **Counter**: Simple state increment/decrement
  - Location: `smart_contracts/counter/contract.py`
  - Client SDK: `artifacts/counter/counter_client.py`

- **Bank**: Multi-user savings example
  - Location: `smart_contracts/bank/contract.py`
  - Client SDK: `artifacts/bank/bank_client.py`

### Running Tests

```bash
pytest tests/
```

---

## API Integration

### Gemini API (Code Grading)

The `gradeExam()` function in `utils/gradeExam.ts`:

1. Sends student code and exam question to Gemini
2. Receives JSON response: `{ passed: boolean, score: number, feedback: string }`
3. Falls back to simulated grade if API quota exceeded

**Model Support**:
- `gemini-1.5` (default, free tier)
- `gemini-3-flash-preview` (faster, recommended)

### Pinata API (IPFS Storage)

The `pinata.ts` module:

- `pinFileToIPFS()`: Upload certificate image
- `pinJSONToIPFS()`: Upload ARC-3 metadata
- `uploadToIPFS()`: Generic file upload wrapper

**Response Format**:
```json
{
  "IpfsHash": "QmXxxx...",
  "PinSize": 12345,
  "Timestamp": "2024-02-12T..."
}
```

---

## Security & Anti-Cheat

### Active Monitoring

| Event | Detection | Response |
|-------|-----------|----------|
| **Tab Switch** | `visibilitychange` | Pause exam, record violation |
| **Fullscreen Exit** | `fullscreenchange` | Pause exam, record violation |
| **Alt-Tab / Window Loss** | `blur` event | Warn, deduct trust score |
| **External Paste** | Clipboard API (capture phase) | Block paste, record as external |
| **Copy/Cut (Internal)** | `copy`/`cut` on editor | Mark as potential internal paste |
| **Bot Typing Speed** | WPM > 180 | Penalize trust score |
| **Large Bulk Insert** | >10 chars inserted at once | Treat as paste |

### Trust Score Calculation

```
Base: 100%
- Tab Switch: -15%
- Window Focus Loss: -10%
- External Paste: -20%
- Bot Speed (>180 WPM): -50%
- Large Paste (avg >50 chars): -20%
```

### Violation Log

All violations are timestamped and stored in component state, visible in the UI metrics panel.

---

## Certificate Generation & Minting

### Step 1: Code Grading
- Student submits Python code
- Gemini API evaluates against test cases
- Score and feedback returned

### Step 2: Certificate Rendering
If `passed: true`, **generateCertificate()** is called:
- Creates high-resolution Canvas (1200x800px)
- Renders ornate certificate design
- Embeds: student name, score, date, trust metrics
- Outputs: Preview URL + File object for upload

### Step 3: IPFS Upload
- Certificate image pinned to IPFS via Pinata
- ARC-3 metadata object created:
  ```json
  {
    "name": "Python 101 Certificate",
    "description": "Issued to [Student] for score [Score]",
    "image": "ipfs://QmXxxx",
    "properties": {
      "score": 92,
      "trust_score": 95,
      "exam": "Python 101",
      "issuer": "Algo-Cert Academy"
    }
  }
  ```
- Metadata pinned to IPFS

### Step 4: NFT Minting
- **Asset Creation** via `algorand.send.assetCreate()`:
  - Total supply: 1 (non-fungible)
  - Decimals: 0
  - Unit name: `CERT`
  - Asset name: `PY101-CERT`
  - URL: `ipfs://QmXxxx#arc3` (points to metadata)
  - Manager: Student's wallet address
- Transaction signed by student via wallet
- ASA created and transferred to student's wallet
- Certificate is now immutable, verifiable, and portable

---

## Environment Variables Reference

### Required (No Defaults)
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `VITE_PINATA_JWT`: Pinata authentication JWT

### Optional (With Defaults)
- `VITE_GEMINI_MODEL`: AI model name (default: `gemini-1.5`)
- `VITE_STUDENT_NAME`: Certificate recipient name (default: derived from wallet address)
- `VITE_NETWORK`: Blockchain network (default: `testnet`)

### Algorand RPC (Defaults to AlgoNode)
- `VITE_ALGOD_SERVER`: Algorand node server
- `VITE_ALGOD_PORT`: Algorand node port (usually 443)
- `VITE_INDEXER_SERVER`: Indexer server
- `VITE_INDEXER_PORT`: Indexer port (usually 443)

---

## Troubleshooting

### Issue: "API Key not found"
**Solution**: Ensure `.env` file exists in `projects/frontend/` and contains `VITE_GEMINI_API_KEY`.

### Issue: Paste detection not working
**Solution**: Verify browser allows clipboard API (HTTPS required in production). Check DevTools console for permission errors.

### Issue: Fullscreen mode not toggling
**Solution**: Some browsers restrict fullscreen. Try F11 or allow fullscreen permission. Check browser console for errors.

### Issue: Wallet connection fails
**Solution**: Ensure a compatible wallet (Pera, Defly) is installed and network matches configured RPC.

### Issue: ASA minting fails
**Solution**: Verify:
- Student has sufficient ALGO (>0.2 for fees)
- Wallet is connected and on correct network
- Pinata upload succeeded (check returned CID)

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes with clear messages (`git commit -m "feat: description"`)
4. Push to your fork (`git push origin feature/your-feature`)
5. Submit a pull request with test results

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## Support & Community

- 📖 **Documentation**: See `Alokit_setup.md` for detailed setup
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Join community discussions
- 📧 **Email**: vaibhavspatre@gmail.com

---

## Acknowledgments

- **AlgoKit** team for smart contract scaffolding
- **Algorand Foundation** for the blockchain infrastructure
- **Pinata** for IPFS hosting
- **Google** for Gemini API
- **Monaco** for the editor component

---

**Built with ❤️ for the Algorand ecosystem**

*Last Updated: February 2026*
