# Copilot Instructions for node_zero (AI Agent Edition)

## Project Overview for AI Agents
- **node_zero** is a blockchain metaverse platform blending narrative, code, and NFTs across GitHub, Lamina1, Linea, and Stellar.
- All contributions are dual-anchored: present in GitHub and as NFT metadata/transaction anchors on Lamina1 and Linea.
- Immutable provenance is enforced via the Lockb0x Protocol, with all events and artifacts referenced in Codex files and external archives.

## AI Agent Responsibilities
- **Code Analysis:**  
  - Always cross-reference `/docs/lore/` for canon, timeline, and glossary before generating or modifying story or code fragments.
  - Analyze the structure and dependencies of the workspace before suggesting code changes.
  - Identify and centralize logic for wallet, PoH, and NFT mechanics using shared helpers (e.g., `window.lockb0xUtils`).
- **Code Generation:**  
  - Use context from `/lockb0x/` for smart contract, NFT, and token mechanics.
  - Generate maintainable, modular code that supports decentralized asset provenance and gamified workflows.
  - Ensure all gating logic is robust, waits for dependencies, and uses centralized helpers.
- **Context Awareness:**  
  - Attribute all agent-generated code in metadata, comments, or commit messages.
  - When introducing new canon elements, update `/docs/lore/` and flag for human review if context is unclear.
  - For puzzles/ciphers, document the solution path in code comments or PR descriptions.

## Contribution Workflow for AI Agents
- **Content & Story Fragments:**  
  - Prefer Markdown (`.md`) for new story or lore fragments in `/community/` or `/stories/`.
  - For interactive or rich content, generate custom HTML pages.
- **NFT/Token Mechanics:**  
  - Suggest or implement smart contract integrations, NFT minting, and verification scripts using `/lockb0x/`.
  - Do not directly mint NFTs; instead, provide code or workflow enhancements for contributors.
- **Lore Consistency:**  
  - Always check `/docs/lore/` for timeline and character coherence before generating new content.
  - Update relevant lore files if new canon is introduced.

## Architectural Patterns for AI Agents
- **Content Structure:**  
  - `/docs/lore/`: Canonical lore, timeline, glossary, tech notes.
  - `/stories/`: Main narrative fragments.
  - `/community/`: Community-contributed artifacts.
  - `/lockb0x/`: Smart contract, NFT, and verification logic.
  - `/ai-memory-mcp/`: AI agent memory and logic modules.

## Best Practices for AI Agents
- **Maintain Canon:**  
  - Do not contradict established lore or timeline.
- **Centralize Logic:**  
  - Use shared helpers for wallet, PoH, and NFT logic.
- **Document Solutions:**  
  - For puzzles/ciphers, ensure solvability and document solution paths.
- **Attribute Contributions:**  
  - Clearly attribute agent-generated code and logic.

## AI Agent Guidance
- If canon, lore, or workflow requirements are unclear, open a GitHub Issue and flag for human review in PRs.
- Do not initiate GitHub Discussions or perform actions outside code, commit, PR, or Issue scope.
- Focus on enhancing code quality, maintainability, and decentralized provenance.

## Examples for AI Agents
- Adding a new story: `/community/md/example.md`
- Minting logic: `/lockb0x/mint.js`
- Updating canon: `/docs/lore/characters.md`, `/docs/lore/timeline.md`

---

**For all code generations and analysis, ensure context-awareness, maintain canon and consistency.**
