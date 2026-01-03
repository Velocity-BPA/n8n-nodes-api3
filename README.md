# n8n-nodes-api3

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for API3 decentralized oracle protocol providing 10 resources and 50+ operations for dAPIs, Airnodes, OEV auctions, DAO governance, and staking. Includes multi-chain support and poll-based triggers.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features

- **dAPIs (Decentralized APIs)**: Read price feeds, get feed info, list available feeds, check deviation thresholds
- **Data Feeds**: Read raw data feeds by ID, get historical values, batch read multiple feeds
- **Airnodes**: Get Airnode info, list available nodes, make Airnode requests
- **OEV (Oracle Extractable Value)**: Get OEV network info, view auctions, place bids
- **API3 DAO**: Get staking info, user stake, stake/unstake tokens, claim rewards
- **Governance**: Get proposals, vote on proposals, check vote records, view treasury
- **API3 Token**: Get price, supply info, user balances, transfer tokens
- **Insurance/Coverage**: Get policy info, available coverage, claims history
- **Subscriptions**: Manage dAPI subscriptions
- **Utilities**: Get supported chains, contract addresses, encode parameters, health checks
- **Triggers**: Poll-based triggers for price updates, deviation thresholds, auctions, proposals, and rewards

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-api3`
4. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-api3
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-api3.git
cd n8n-nodes-api3

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-api3

# Restart n8n
```

## Credentials Setup

Create API3 credentials in n8n with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Network | Select | Yes | Blockchain network (ethereum, polygon, arbitrum, etc.) |
| RPC Endpoint | String | Yes | JSON-RPC endpoint URL |
| Private Key | Password | No | For write operations (staking, voting, transfers) |
| API3 Market API Key | Password | No | For enhanced API3 Market API access |
| OEV Network API Key | Password | No | For OEV auction operations |

### Getting an RPC Endpoint

You can use free RPC endpoints from:
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)
- [QuickNode](https://www.quicknode.com/)
- [Ankr](https://www.ankr.com/)

Or use public endpoints (rate limited):
- Ethereum: `https://eth.llamarpc.com`
- Polygon: `https://polygon-rpc.com`
- Arbitrum: `https://arb1.arbitrum.io/rpc`

## Resources & Operations

### dAPIs

| Operation | Description |
|-----------|-------------|
| Get dAPI Value | Read current price feed value |
| Get dAPI Info | Get feed details (sources, deviation) |
| List dAPIs | Get available feeds for network |
| Get dAPI Update Time | Get last update timestamp |
| Get dAPI Deviation | Get update threshold |
| Get dAPI Sources | Get data provider list |

### Data Feeds

| Operation | Description |
|-----------|-------------|
| Read Data Feed | Get current value by feed ID |
| Get Feed History | Get historical values |
| Get Feed Metadata | Get feed information |
| Get Multiple Feeds | Batch read feeds |
| Get Feed Beacon | Get individual source data |

### Airnodes

| Operation | Description |
|-----------|-------------|
| Get Airnode Info | Get node details |
| List Airnodes | Get available Airnodes |
| Get Airnode Endpoints | Get API endpoints |
| Make Airnode Request | Call API through Airnode |
| Get Request Status | Check response status |

### OEV (Oracle Extractable Value)

| Operation | Description |
|-----------|-------------|
| Get OEV Network Info | Get network status |
| Get Auction Info | Get current auction details |
| Place OEV Bid | Submit bid |
| Get Bid Status | Check bid result |
| Get OEV Stats | Get protocol statistics |

### API3 DAO

| Operation | Description |
|-----------|-------------|
| Get Staking Info | Get staking pool details |
| Get User Stake | Get user's staked amount |
| Stake API3 | Deposit tokens to staking pool |
| Unstake API3 | Request withdrawal |
| Get Rewards | Get pending rewards |
| Claim Rewards | Withdraw rewards |
| Get APR | Get current staking yield |

### Governance

| Operation | Description |
|-----------|-------------|
| Get Proposals | Get DAO proposals |
| Get Proposal | Get single proposal |
| Vote on Proposal | Cast vote |
| Get Vote Record | Get voting history |
| Get Treasury | Get DAO treasury |

### API3 Token

| Operation | Description |
|-----------|-------------|
| Get API3 Price | Get current price |
| Get API3 Supply | Get token supply |
| Get User Balance | Get token balance |
| Transfer API3 | Send tokens |

### Insurance (Coverage)

| Operation | Description |
|-----------|-------------|
| Get Coverage Info | Get policy details |
| Get Available Coverage | Get available policies |
| Get Claims | Get claim history |
| Check Coverage | Verify active policy |

### Subscriptions

| Operation | Description |
|-----------|-------------|
| Get Subscription | Get dAPI subscription |
| List Subscriptions | Get active subscriptions |
| Create Subscription | Subscribe to dAPI |
| Renew Subscription | Extend subscription |

### Utility

| Operation | Description |
|-----------|-------------|
| Get Supported Chains | Get available networks |
| Get Contract Addresses | Get deployed contracts |
| Encode Parameters | Encode Airnode parameters |
| Get API Health | Check service status |

## Trigger Node

The API3 Trigger node polls for events at configurable intervals:

| Trigger | Description |
|---------|-------------|
| dAPI Price Update | Fires when a dAPI price feed is updated |
| dAPI Deviation Threshold | Fires when price moves beyond threshold |
| OEV Auction Started | Fires when a new OEV auction begins |
| Governance Proposal | Fires when a new DAO proposal is created |
| Stake Reward Available | Fires when staking rewards are available |

## Usage Examples

### Read ETH/USD Price

```json
{
  "nodes": [
    {
      "name": "API3",
      "type": "n8n-nodes-api3.api3",
      "parameters": {
        "resource": "dapis",
        "operation": "getDAPIValue",
        "dapiName": "ETH/USD"
      }
    }
  ]
}
```

### Get User Staking Info

```json
{
  "nodes": [
    {
      "name": "API3",
      "type": "n8n-nodes-api3.api3",
      "parameters": {
        "resource": "dao",
        "operation": "getUserStake",
        "userAddress": "0x..."
      }
    }
  ]
}
```

## API3 Concepts

| Concept | Description |
|---------|-------------|
| dAPI | Decentralized API - managed price feed aggregating multiple data sources |
| Airnode | First-party oracle node run directly by API providers |
| Beacon | Single data point from one Airnode |
| Beacon Set | Aggregated data from multiple beacons |
| OEV | Oracle Extractable Value - auction mechanism for price update priority |
| API3 DAO | Governance and staking organization |
| Coverage | Insurance for oracle service reliability |
| Deviation | Price change threshold triggering automatic updates |

## Networks

| Network | Chain ID | Features |
|---------|----------|----------|
| Ethereum | 1 | dAPIs, DAO, Staking, Governance |
| Polygon | 137 | dAPIs |
| Arbitrum | 42161 | dAPIs |
| Arbitrum Nova | 42170 | dAPIs |
| Optimism | 10 | dAPIs |
| Avalanche | 43114 | dAPIs |
| BSC | 56 | dAPIs |
| Base | 8453 | dAPIs |
| Gnosis | 100 | dAPIs |
| Fantom | 250 | dAPIs |
| zkSync | 324 | dAPIs |
| Moonbeam | 1284 | dAPIs |
| Moonriver | 1285 | dAPIs |
| Metis | 1088 | dAPIs |
| Mantle | 5000 | dAPIs |
| Scroll | 534352 | dAPIs |
| Linea | 59144 | dAPIs |
| Polygon zkEVM | 1101 | dAPIs |
| Goerli | 5 | dAPIs (testnet) |
| Sepolia | 11155111 | dAPIs (testnet) |

## Error Handling

The node provides descriptive error messages for common issues:

- **Invalid RPC endpoint**: Check your RPC URL and network selection
- **Invalid address**: Ensure addresses are valid Ethereum addresses (0x...)
- **Network not supported**: Operation may not be available on selected network
- **Private key required**: Write operations require a private key
- **Rate limited**: Consider using a private RPC endpoint

## Security Best Practices

1. **Never expose private keys** - Use n8n credentials storage
2. **Use dedicated wallets** - Don't use main wallets for automation
3. **Test on testnets first** - Use Goerli/Sepolia for testing
4. **Limit permissions** - Only fund wallets with needed amounts
5. **Monitor transactions** - Set up alerts for wallet activity

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build
npm run build

# Watch mode
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-api3/issues)
- [API3 Documentation](https://docs.api3.org/)
- [n8n Community](https://community.n8n.io/)

## Acknowledgments

- [API3](https://api3.org/) - Decentralized APIs for Web 3.0
- [n8n](https://n8n.io/) - Workflow automation platform
- [Velocity BPA](https://velobpa.com/) - Business process automation
