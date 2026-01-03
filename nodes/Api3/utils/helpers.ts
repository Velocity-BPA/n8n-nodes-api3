/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { NETWORK_CONFIGS, DEFAULT_DECIMALS, LICENSING_NOTICE } from '../constants';

// Track if licensing notice has been logged
let licensingNoticeLogged = false;

/**
 * Log licensing notice once per node load
 */
export function logLicensingNotice(_context: IExecuteFunctions | ILoadOptionsFunctions): void {
  if (!licensingNoticeLogged) {
    console.warn(LICENSING_NOTICE);
    licensingNoticeLogged = true;
  }
}

/**
 * Get credentials from n8n
 */
export async function getCredentials(context: IExecuteFunctions | ILoadOptionsFunctions) {
  const credentials = await context.getCredentials('api3Credentials');

  return {
    network: credentials.network as string,
    rpcEndpoint: credentials.rpcEndpoint as string,
    privateKey: credentials.privateKey as string | undefined,
    api3MarketApiKey: credentials.api3MarketApiKey as string | undefined,
    oevApiKey: credentials.oevApiKey as string | undefined,
  };
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate bytes32
 */
export function isValidBytes32(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Validate private key
 */
export function isValidPrivateKey(key: string): boolean {
  return /^(0x)?[a-fA-F0-9]{64}$/.test(key);
}

/**
 * Format wei to ether
 */
export function weiToEther(wei: bigint | string): string {
  const value = BigInt(wei);
  const divisor = BigInt(10 ** 18);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(18, '0');
  // Trim trailing zeros
  const trimmed = fractionalStr.replace(/0+$/, '') || '0';
  return fractionalStr === '000000000000000000'
    ? integerPart.toString()
    : `${integerPart}.${trimmed}`;
}

/**
 * Format ether to wei
 */
export function etherToWei(ether: string): bigint {
  const parts = ether.split('.');
  const integerPart = parts[0] || '0';
  let fractionalPart = parts[1] || '0';

  // Pad or trim fractional part to 18 digits
  fractionalPart = fractionalPart.padEnd(18, '0').slice(0, 18);

  return BigInt(integerPart + fractionalPart);
}

/**
 * Format value with custom decimals
 */
export function formatWithDecimals(value: bigint | string, decimals: number): string {
  const bn = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const integerPart = bn / divisor;
  const fractionalPart = bn % divisor;

  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.replace(/0+$/, '');
  return `${integerPart}.${trimmed}`;
}

/**
 * Parse value with decimals
 */
export function parseWithDecimals(value: string, decimals: number): bigint {
  const parts = value.split('.');
  const integerPart = parts[0] || '0';
  let fractionalPart = parts[1] || '0';

  fractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals);

  return BigInt(integerPart + fractionalPart);
}

/**
 * Get decimals for dAPI (default 18 for most price feeds)
 */
export function getDAPIDecimals(dapiName: string): number {
  // Most dAPIs use 18 decimals
  // Some specific feeds might use different decimals
  const customDecimals: Record<string, number> = {
    // Add any custom decimal configurations here
  };

  return customDecimals[dapiName] || DEFAULT_DECIMALS;
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: bigint, newValue: bigint): string {
  if (oldValue === BigInt(0)) {
    return '0';
  }

  const change = ((newValue - oldValue) * BigInt(10000)) / oldValue;
  const percentage = Number(change) / 100;
  return percentage.toFixed(2);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Check if network supports DAO operations
 */
export function supportsDAO(network: string): boolean {
  // DAO is only on Ethereum mainnet
  return network === 'ethereum';
}

/**
 * Check if network supports staking
 */
export function supportsStaking(network: string): boolean {
  // Staking is only on Ethereum mainnet
  return network === 'ethereum';
}

/**
 * Get network explorer URL for transaction
 */
export function getExplorerTxUrl(network: string, txHash: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    return '';
  }
  return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Get network explorer URL for address
 */
export function getExplorerAddressUrl(network: string, address: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    return '';
  }
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Validate required parameters
 */
export function validateRequiredParams(
  context: IExecuteFunctions,
  params: Record<string, unknown>,
  required: string[],
): void {
  for (const param of required) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      throw new NodeOperationError(context.getNode(), `Parameter '${param}' is required`, {
        itemIndex: 0,
      });
    }
  }
}

/**
 * Build return data structure
 */
export function buildReturnData(data: unknown): INodeExecutionData[] {
  if (Array.isArray(data)) {
    return data.map((item) => ({ json: item as IDataObject }));
  }
  return [{ json: data as IDataObject }];
}

/**
 * Parse dAPI name variations
 */
export function normalizeDAPIName(name: string): string {
  // Handle different input formats
  // e.g., "ETH-USD", "eth/usd", "ETH_USD" -> "ETH/USD"
  return name.replace(/[-_]/g, '/').toUpperCase();
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten nested object
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix: string = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}
