/*
 * Front‑end script to mint a lockb0x Key NFT on Linea using MetaMask and
 * ethers.js v6. The page should import ethers.min.js locally. Update
 * CONTRACT_ADDRESS to your deployed contract.
 */
import { ethers } from './ethers.min.js';

// Set your deployed contract address
const CONTRACT_ADDRESS = '0x1c6445eBcEe5b9B12cfA63AecA1fa3e90b06BFcC';

// ABI extended to include balanceOf for ownership check
const CONTRACT_ABI = [
  'function mint() external payable',
  'function mintPrice() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)'
];

async function connectAndMint() {
  const statusEl = document.getElementById('status');
  const mintBtn  = document.getElementById('mintBtn');
  statusEl.textContent = '';
  mintBtn.disabled = true;

  try {
    if (!window.ethereum) {
      statusEl.textContent = 'MetaMask is required.';
      return;
    }

    // Request wallet connection
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create a provider with ENS disabled for Linea Sepolia (59141)
    const provider = new ethers.BrowserProvider(window.ethereum, {
      chainId: 59141,
      name: 'linea-sepolia',
      ensAddress: null
    });
    const signer = await provider.getSigner();

    // Ensure we’re on Linea Sepolia; prompt switch if necessary
    const network = await provider.getNetwork();
    if (network.chainId !== 59141n) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xe704' }] // 59141 hex
        });
      } catch (switchErr) {
        statusEl.textContent = 'Please switch to the Linea Sepolia network.';
        return;
      }
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Check if user already owns a key
    const address = await signer.getAddress();
    const balance = await contract.balanceOf(address);
    if (balance > 0n) {
      statusEl.textContent = 'You already hold a lockb0x Key.';
      return;
    }

    // Fetch mint price
    const priceWei = await contract.mintPrice();

    // Send mint transaction
    const tx = await contract.mint({ value: priceWei });
    statusEl.textContent = `Transaction submitted: ${tx.hash}`;

    // Wait for confirmation
    await tx.wait();
    statusEl.textContent = 'Mint successful! Your NFT has been created.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message ?? err}`;
  } finally {
    // Re‑enable the button whether success or error
    mintBtn.disabled = false;
  }
}

document.getElementById('mintBtn').onclick = connectAndMint;
