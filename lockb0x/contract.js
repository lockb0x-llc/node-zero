// contract.js - Contract address/ABI, contract factory, NFT ownership, mint helpers

export async function fetchAddress() {
    const res = await fetch("./contract-address.json");
    const json = await res.json();
    if (!json.address)
        throw new Error("contract-address.json missing 'address' field");
    return json.address;
}

export async function fetchAbi() {
    const res = await fetch("./abi.json");
    const json = await res.json();
    if (!Array.isArray(json))
        throw new Error("ABI file malformed");
    return json;
}

export async function getContract(getSigner) {
    const address = await fetchAddress();
    const abi = await fetchAbi();
    const signer = await getSigner();
    return new window.ethers.Contract(address, abi, signer);
}

export async function hasLockb0xSigilNFT(address) {
    if (!window.ethereum || !address) return false;
    const lineaSepoliaChainId = '0xe705';
    let chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== lineaSepoliaChainId) {
        return false;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    try {
        const balance = await contract.balanceOf(address);
        return balance && balance.gt(0);
    } catch (e) {
        return false;
    }
}

export function setupNFTRecheck(onRecheck) {
    if (!window.ethereum) return;
    window.ethereum.removeAllListeners?.('chainChanged');
    window.ethereum.removeAllListeners?.('accountsChanged');
    window.ethereum.on('chainChanged', () => {
        onRecheck();
    });
    window.ethereum.on('accountsChanged', () => {
        onRecheck();
    });
}

export async function checkOwnership(getContract, getSigner) {
    const contract = await getContract(getSigner);
    const signer = await getSigner();
    const address = await signer.getAddress();
    if (typeof contract.balanceOf !== "function") {
        throw new Error("Contract does not support balanceOf");
    }
    let balance;
    try {
        balance = await contract.balanceOf(address);
    } catch (err) {
        throw new Error("Failed to check ownership: " + (err?.message || err));
    }
    return (typeof balance === "bigint" ? balance : BigInt(balance)) > 0n;
}
