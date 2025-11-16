/*
 * Front‑end script to verify ownership of a lockb0x Key NFT. The user
 * connects with MetaMask, the script checks the `balanceOf()` function on
 * the ERC‑721 contract, and if the user holds at least one token calls
 * `verifyOwnership()` to emit an event on chain. Replace
 * `CONTRACT_ADDRESS` with your deployed address after deployment.
 */

import { ethers } from './ethers.min.js';

const CONTRACT_ADDRESS = '0x1c6445eBcEe5b9B12cfA63AecA1fa3e90b06BFcC';

const CONTRACT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function verifyOwnership() external',
];

async function verify() {
  const resultEl = document.getElementById('result');
  resultEl.textContent = '';

  try {
    if (!window.ethereum) {
      resultEl.textContent = 'MetaMask is required.';
      return;
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Ensure network is Linea Sepolia (chain ID 59141)
    const network = await provider.getNetwork();
    const lineaSepoliaChainId = 59141n;
    if (network.chainId !== lineaSepoliaChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xe704' }],
        });
      } catch (switchError) {
        resultEl.textContent = 'Please switch to the Linea Sepolia network.';
        return;
      }
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const user = await signer.getAddress();
    const balance = await contract.balanceOf(user);

    if (balance > 0n) {
      resultEl.textContent = 'NFT detected — submitting verification…';
      const tx = await contract.verifyOwnership();
      resultEl.textContent = `Transaction submitted: ${tx.hash}`;
      await tx.wait();
      resultEl.textContent = 'Verification successful! Event emitted.';
    } else {
      resultEl.textContent = 'You do not own a lockb0x Key NFT.';
    }
  } catch (err) {
    console.error(err);
    resultEl.textContent = `Error: ${err.message ?? err}`;
  }
}

document.getElementById('verifyBtn').onclick = verify;