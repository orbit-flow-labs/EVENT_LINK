# 🤝 Contributing to EventLink

Thank you for your interest in contributing to **EventLink**! 

Whether you are an individual developer, an open-source contributor, a grant evaluator, or an organization building on Stellar & Soroban, your contributions are welcome.

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free community for everyone.

### Our Standards
- **Respect & Professionalism:** Treat all community members with empathy, constructive feedback, and respect.
- **Inclusivity:** We welcome contributors of all skill levels, backgrounds, and identities.
- **Integrity:** Ensure code submissions, pull requests, and documentation are honest, tested, and original work.

---

## 🛠️ How You Can Contribute

There are many ways to contribute to EventLink:

1. **Reporting Bugs:** Found an error, broken flow, or wallet connection issue? Open an issue on GitHub using our Bug Report template.
2. **Proposing Features:** Have ideas for secondary resale markets, Soroban smart contract optimizations, or additional fiat gateways? Open a Feature Request issue.
3. **Submitting Pull Requests:** Fix an open issue or implement an approved feature request.
4. **Improving Documentation:** Enhance setup guides, write tutorials, or add architecture diagrams.
5. **Ecosystem & Community Outreach:** Test EventLink at real events, demo the platform to event organizers, or partner with grant foundations.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm** or **yarn**

### Step-by-Step Environment Setup

1. **Fork & Clone the Repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/event-link.git
   cd event-link
   ```

2. **Install Root Dependencies:**
   ```bash
   npm install
   ```

3. **Configure the Frontend API URL:**
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_BASE_URL` if the backend is not running at its local default. Backend settings are documented in [EVENT_LINK_BACKEND-](https://github.com/orbit-flow-labs/EVENT_LINK_BACKEND-).

4. **Run the Frontend:**
   ```bash
   npm run dev
   ```

The backend and Soroban contract are maintained separately in [EVENT_LINK_BACKEND-](https://github.com/orbit-flow-labs/EVENT_LINK_BACKEND-) and [EVENT_LINK_CONTRACT](https://github.com/orbit-flow-labs/EVENT_LINK_CONTRACT).

---

## 🔀 Workflow & Pull Request (PR) Process

To maintain high code quality and security, please follow this PR workflow:

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Commit Changes with Clear Messages:**
   Use conventional commit standards:
   - `feat(soroban): add batch minting function to smart contract`
   - `fix(scanner): resolve offline HMAC verification fallback`
   - `docs(readme): update environment setup instructions`

3. **Run Code Formatting & Type Checks:**
   ```bash
   npm run build
   ```

4. **Push Branch & Open PR:**
   - Push your branch: `git push origin feature/your-feature-name`
   - Navigate to GitHub and open a Pull Request against `main`.
   - Provide a concise summary of changes, screenshot previews (if UI changes were made), and references to linked issues.

---

## 🏛️ For Organizations & Enterprise Partners

EventLink is designed to be extensible for event production companies, ticketing agencies, and Web3 protocols:

- **Custom Gateway Integration:** Extend backend routes in [EVENT_LINK_BACKEND-](https://github.com/orbit-flow-labs/EVENT_LINK_BACKEND-) to add regional payment provider support (e.g., Paystack, Razorpay).
- **Custom Soroban Contracts:** Modify [EVENT_LINK_CONTRACT](https://github.com/orbit-flow-labs/EVENT_LINK_CONTRACT) to support soulbound passes, dynamic ticket tiers, or specialized royalty distribution.
- **Enterprise Inquiries:** Reach out via GitHub Discussions or open an issue to explore custom enterprise deployments.

---

## 📄 License

By contributing to EventLink, you agree that your contributions will be licensed under the project's [MIT License](event-link/LICENSE).
