# rx-chain

A blockchain-based prescription registry built on Ethereum (Sepolia testnet) with a React frontend.

---

## 1. Clone & Install

```sh
git clone https://github.com/kpharthiban/rx-chain.git
cd rx-chain
npm install

cd frontend
npm install
cd ..
```

---

## 2. Configure ENV Secrets

### Root (`/.env`)

Copy the example and fill in your values:

```sh
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `SEPOLIA_RPC_URL` | [Infura](https://app.infura.io) or [Alchemy](https://dashboard.alchemy.com) — create a Sepolia app, copy the HTTPS endpoint |
| `DEPLOYER_PRIVATE_KEY` | MetaMask → Account Details → Export Private Key (deployer wallet only) |
| `ETHERSCAN_API_KEY` | [etherscan.io/myapikey](https://etherscan.io/myapikey) — free account |
| `PINATA_API_KEY` / `PINATA_SECRET_KEY` | [app.pinata.cloud/keys](https://app.pinata.cloud/keys) — free account |
| `VITE_CONTRACT_ADDRESS` | Fill this in after deploying (Step 3) |

### Frontend (`/frontend/.env`)

```sh
cp frontend/.env.example frontend/.env
```

| Variable | Where to get it |
|---|---|
| `VITE_CONTRACT_ADDRESS` | Output from the deploy script (Step 3) |
| `VITE_PINATA_JWT` | [app.pinata.cloud/keys](https://app.pinata.cloud/keys) → Generate API Key → copy the JWT |

---

## 3. Deploy the Contract

Make sure your deployer wallet has Sepolia ETH ([faucet](https://sepoliafaucet.com)).

```sh
npx hardhat run scripts/deploy.js --network sepolia
```

The script will print the deployed contract address and auto-verify it on Etherscan. Copy the address into both `.env` files:

```
VITE_CONTRACT_ADDRESS=0xYourDeployedAddress
```

---

## 4. Run the Frontend

```sh
cd frontend
npm run dev
```

App runs at `http://localhost:5173`. Connect MetaMask to Sepolia testnet.
