/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { NetworkConfig, SupportedChain } from '../utils/types';

/**
 * Licensing notice - displayed once per node load
 */
export const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

/**
 * Network configurations
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    explorerUrl: 'https://etherscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
    api3TokenAddress: '0x0b38210ea11411557c13457D4dA7dC6ea731B88a',
    stakingPoolAddress: '0x6dd655f10d4b9E242aE186D9050B68F725c76d76',
    governanceAddress: '0x1d7573de8b3cF1c5B0e16be54a0E20a78B8e5e6e4',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    explorerUrl: 'https://arbiscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  'arbitrum-nova': {
    chainId: 42170,
    name: 'Arbitrum Nova',
    explorerUrl: 'https://nova.arbiscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    explorerUrl: 'https://optimistic.etherscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    explorerUrl: 'https://snowtrace.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    explorerUrl: 'https://bscscan.com',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  gnosis: {
    chainId: 100,
    name: 'Gnosis',
    explorerUrl: 'https://gnosisscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  fantom: {
    chainId: 250,
    name: 'Fantom',
    explorerUrl: 'https://ftmscan.com',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  zksync: {
    chainId: 324,
    name: 'zkSync Era',
    explorerUrl: 'https://explorer.zksync.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  scroll: {
    chainId: 534352,
    name: 'Scroll',
    explorerUrl: 'https://scrollscan.com',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  linea: {
    chainId: 59144,
    name: 'Linea',
    explorerUrl: 'https://lineascan.build',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  mantle: {
    chainId: 5000,
    name: 'Mantle',
    explorerUrl: 'https://explorer.mantle.xyz',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  moonbeam: {
    chainId: 1284,
    name: 'Moonbeam',
    explorerUrl: 'https://moonscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  moonriver: {
    chainId: 1285,
    name: 'Moonriver',
    explorerUrl: 'https://moonriver.moonscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  celo: {
    chainId: 42220,
    name: 'Celo',
    explorerUrl: 'https://celoscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    explorerUrl: 'https://goerli.etherscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    explorerUrl: 'https://sepolia.etherscan.io',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
  mumbai: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    explorerUrl: 'https://mumbai.polygonscan.com',
    dapiServerAddress: '0x3dEC619dc529363767dEe9E71d8dD1A5bc270D76',
  },
};

/**
 * Supported chains list
 */
export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'eth',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://etherscan.io',
    testnet: false,
  },
  {
    chainId: 137,
    name: 'Polygon',
    shortName: 'matic',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    explorerUrl: 'https://polygonscan.com',
    testnet: false,
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'arb1',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://arbiscan.io',
    testnet: false,
  },
  {
    chainId: 10,
    name: 'Optimism',
    shortName: 'oeth',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://optimistic.etherscan.io',
    testnet: false,
  },
  {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'avax',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    explorerUrl: 'https://snowtrace.io',
    testnet: false,
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'bnb',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    explorerUrl: 'https://bscscan.com',
    testnet: false,
  },
  {
    chainId: 8453,
    name: 'Base',
    shortName: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://basescan.org',
    testnet: false,
  },
  {
    chainId: 100,
    name: 'Gnosis',
    shortName: 'gno',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    explorerUrl: 'https://gnosisscan.io',
    testnet: false,
  },
  {
    chainId: 250,
    name: 'Fantom',
    shortName: 'ftm',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    explorerUrl: 'https://ftmscan.com',
    testnet: false,
  },
  {
    chainId: 324,
    name: 'zkSync Era',
    shortName: 'zksync',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://explorer.zksync.io',
    testnet: false,
  },
];

/**
 * dAPI Server ABI (subset for reading)
 */
export const DAPI_SERVER_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'dapiName', type: 'bytes32' }],
    name: 'readDataFeedWithDapiName',
    outputs: [
      { internalType: 'int224', name: 'value', type: 'int224' },
      { internalType: 'uint32', name: 'timestamp', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'dataFeedId', type: 'bytes32' }],
    name: 'readDataFeedWithId',
    outputs: [
      { internalType: 'int224', name: 'value', type: 'int224' },
      { internalType: 'uint32', name: 'timestamp', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'dapiName', type: 'bytes32' }],
    name: 'dapiNameToDataFeedId',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * API3 Token ABI (subset)
 */
export const API3_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Staking Pool ABI (subset)
 */
export const STAKING_POOL_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'userAddress', type: 'address' }],
    name: 'userStake',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStake',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'apr',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'userAddress', type: 'address' }],
    name: 'getUserReward',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Default decimals for dAPIs (most price feeds use 18 decimals)
 */
export const DEFAULT_DECIMALS = 18;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  API3_MARKET: 'https://market.api3.org/api',
  OEV_NETWORK: 'https://oev.api3.org/api',
  COINGECKO: 'https://api.coingecko.com/api/v3',
};

/**
 * Common dAPI names
 */
export const COMMON_DAPIS = [
  'ETH/USD',
  'BTC/USD',
  'MATIC/USD',
  'AVAX/USD',
  'BNB/USD',
  'SOL/USD',
  'ARB/USD',
  'OP/USD',
  'LINK/USD',
  'UNI/USD',
  'AAVE/USD',
  'CRV/USD',
  'MKR/USD',
  'SNX/USD',
  'COMP/USD',
  'SUSHI/USD',
  'YFI/USD',
  'BAL/USD',
  'API3/USD',
  'EUR/USD',
  'GBP/USD',
  'JPY/USD',
  'AUD/USD',
  'CAD/USD',
  'CHF/USD',
];

/**
 * Poll intervals for triggers (in milliseconds)
 */
export const POLL_INTERVALS = {
  FAST: 30000, // 30 seconds
  NORMAL: 60000, // 1 minute
  SLOW: 300000, // 5 minutes
};

/**
 * Cache TTL (in milliseconds)
 */
export const CACHE_TTL = {
  DAPI_VALUE: 10000, // 10 seconds
  DAPI_INFO: 300000, // 5 minutes
  TOKEN_PRICE: 60000, // 1 minute
  STAKING_INFO: 60000, // 1 minute
};
