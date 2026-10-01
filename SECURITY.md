# 🛡️ Security Policy & Guidelines

At **EventLink**, security is paramount. Because our application bridges traditional Web2 payment infrastructure with Web3 smart contract assets, we enforce strict security boundaries to protect user funds, asset keys, and personal data.

---

## 🔒 Core Security Controls

### 1. Webhook Signature Verification
All payment notifications from **Stripe** and **Flutterwave** are validated cryptographically before triggering any database mutation or on-chain transaction:
- **Stripe:** Validated via `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`.
- **Flutterwave:** Validated using secret header signature hashes (`verif-hash`).

### 2. Isolation of Blockchain Private Keys
- Backend issuer and distributor secret keys (`SD...`, `SB...`) are loaded strictly into environment variables.
- Client bundles never contain or expose secret keys.
- User wallet interactions use non-custodial browser extensions (**Freighter**) or web signers (**Albedo**).

### 3. Fraud-Proof QR Code Construction
Ticket QR codes do not transmit raw ticket IDs or static URLs. Each payload contains:
- HMAC SHA-256 signature generated with server secret `QR_SECRET`.
- Unique nonce timestamp to protect against replay attacks.
- Tamper-evident encoding preventing ticket duplication.

---

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability within EventLink, please report it responsibly:

- **Email:** `security@eventlink.app`
- **Response SLA:** We acknowledge all security reports within 24 hours.
- **Disclosure Policy:** Please do not publicly disclose vulnerabilities until we have verified and patched the issue.

---

## 📜 Audit Readiness & Best Practices

- **Smart Contract Safety:** Soroban contracts are compiled using standard Rust toolchains and enforce strict authorization checks (`address.require_auth()`).
- **Dependencies:** All npm dependencies are audited regularly using `npm audit` and locked via `package-lock.json`.
- **Repository Scope:** This repository contains the frontend. Report backend or contract vulnerabilities in [EVENT_LINK_BACKEND](https://github.com/orbit-flow-labs/EVENT_LINK_BACKEND) or [EVENT_LINK_CONTRACT](https://github.com/orbit-flow-labs/EVENT_LINK_CONTRACT), respectively.
