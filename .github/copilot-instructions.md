# Copilot Instructions for node_zero

## Project Overview
- **node_zero** is a blockchain metaverse archive, blending narrative, code, and NFTs across GitHub, Lamina1, Linea, and Stellar linked together through the implementationo the lockb0x protocol as an overall decentralized, super-positioned data mangement strategy.
- Every contribution is a "causal anchor" — a fragment of story, artifact, or code, dual-anchored in GitHub and as an NFT on Lamina1 and Linea.
- The project is both a creative writing platform and a technical experiment in decentralized provenance and gamified task/gig work management.
- All participants must be verified through the Linea Proof of Humanity (PoH) system. Most content areas are token-gated based on this verification in addition to the presence of certain NFTs. like the lockb0x Sigil NFT and NFTs specific to the context of the area being accessed.

## Key Architectural Patterns
- **Content Structure:**
  - `/docs/lore/` — Canonical lore: timeline, characters, glossary, tech notes. Always cross-reference before adding new story elements.
  - `/stories/` — Main narrative fragments.
  - `/community/` — Community-contributed stories and artifacts.
  - `/lockb0x/` — Smart contract integrations, NFT minting, and verification scripts.
  - `/ai-memory-mcp/` — AI memory and agent logic.
- **Lockb0x Anchoring:**
  - All valid contributions must be present in both the GitHub repo and as a metadata anchor in a Lamina1 NFT and a transaction anchor on Linea. Reference codes must match.
  - Provenance and immutability are ensured via blockchain anchoring, GitHub Permalinks, social account postings to node_zero accounts on Bluesky, Xitter, Lamina1 NFT Discord posts, AI generated video attestations on a dedicated YouTube channel, and other more or less "immutable" media and data storage archives, through the implementation of the Lockb0x Protocol.
- **Immutable Archive:**
  - Once merged, contributions are permanent. Edits require new anchors.
  - Each transaction or event is chronicled through the creation of a Lockb0x Protocol Codex file. 
  - Each Codex file should be stored in a logical "lockb0xapi@gmail.com/node_zero/codex" directory which is a Google Drive folder linked to the Lockb0x Protocol for immutable record-keeping, in the context of node_zero, using the lockkb0xapi@gmail.com account. This process will be provided by an external API that as being developed for it.

## Contribution Workflow
- **Content & Story Contributions:**
  - Markdown (`.md`) is encouraged for all story and content fragments in `/community/` or `/stories/`.
  - Custom HTML pages are also welcome for richer or interactive presentations.
- **NFT and Token Mechanics:**
  - The agent cannot directly mint NFTs. Instead, it should implement or suggest NFT and token mechanics, smart contract integrations, and related features to complement and enhance the node_zero experience using these technologies, as well as generative and agentic AI methods.
- **Lore Consistency:**
  - Before submitting, check `/docs/lore/` for timeline, character, and glossary coherence. Update these files if introducing new canon elements.
- **Pull Requests:**
  - Each PR should include both the new fragment and any necessary updates to `/docs/lore/`.

## Project-Specific Conventions (for Agents)
  - Maintain canon and timeline coherence. Do not contradict established lore in `/docs/lore/`.
  - If embedding puzzles/ciphers, ensure they are solvable and document the solution path in the code or PR.
  - Attribute all merged agent contributions in metadata or commit messages as appropriate.

## Developer Notes
- **Smart Contract & NFT Integration:**
  - See `/lockb0x/` for contract ABI, address, and minting scripts. Use `mint.js` for NFT operations.
  - Agents should focus on implementing, suggesting, or integrating NFT/token mechanics, generative AI, and agentic AI methods to expand the platform's capabilities.
- **AI Agent Logic:**
  - `/ai-memory-mcp/` contains agent memory and logic modules.
- **No Central Build/Test:**
  - This is a content-first archive; there is no unified build or test system. Scripts in `/lockb0x/` and `/ai-memory-mcp/` are run ad hoc.

## Examples
- Adding a new story: `/community/md/example.md`
- Minting an NFT: `/lockb0x/mint.js`
- Updating canon: `/docs/lore/characters.md`, `/docs/lore/timeline.md`

---


## AI Agent Guidance
- If canon, lore, or workflow requirements are unclear, you may open a GitHub Issue describing the uncertainty. If a Pull Request is created, the issue must also be flagged in the PR description for human review.
- Do not attempt to open GitHub Discussions or perform actions outside code, commit, PR, or Issue scope.
