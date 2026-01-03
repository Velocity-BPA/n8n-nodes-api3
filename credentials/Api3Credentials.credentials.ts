/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class Api3Credentials implements ICredentialType {
  name = 'api3Credentials';
  displayName = 'API3 Credentials';
  documentationUrl = 'https://docs.api3.org';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        { name: 'Ethereum Mainnet', value: 'ethereum' },
        { name: 'Polygon', value: 'polygon' },
        { name: 'Arbitrum One', value: 'arbitrum' },
        { name: 'Arbitrum Nova', value: 'arbitrum-nova' },
        { name: 'Optimism', value: 'optimism' },
        { name: 'Avalanche C-Chain', value: 'avalanche' },
        { name: 'BNB Smart Chain', value: 'bsc' },
        { name: 'Base', value: 'base' },
        { name: 'Gnosis', value: 'gnosis' },
        { name: 'Fantom', value: 'fantom' },
        { name: 'zkSync Era', value: 'zksync' },
        { name: 'Scroll', value: 'scroll' },
        { name: 'Linea', value: 'linea' },
        { name: 'Mantle', value: 'mantle' },
        { name: 'Moonbeam', value: 'moonbeam' },
        { name: 'Moonriver', value: 'moonriver' },
        { name: 'Celo', value: 'celo' },
        { name: 'Goerli (Testnet)', value: 'goerli' },
        { name: 'Sepolia (Testnet)', value: 'sepolia' },
        { name: 'Mumbai (Testnet)', value: 'mumbai' },
      ],
      default: 'ethereum',
      description: 'The blockchain network to connect to',
    },
    {
      displayName: 'RPC Endpoint',
      name: 'rpcEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      description:
        'RPC endpoint URL for the selected network. Use providers like Alchemy, Infura, or QuickNode.',
      required: true,
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: '0x...',
      description:
        'Private key for signing transactions (required for DAO/staking operations). Keep this secure!',
      required: false,
    },
    {
      displayName: 'API3 Market API Key',
      name: 'api3MarketApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: 'Enter your API3 Market API key',
      description: 'Optional API key for API3 Market API access',
      required: false,
    },
    {
      displayName: 'OEV Network API Key',
      name: 'oevApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: 'Enter your OEV Network API key',
      description: 'Optional API key for OEV Network access',
      required: false,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.rpcEndpoint}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
