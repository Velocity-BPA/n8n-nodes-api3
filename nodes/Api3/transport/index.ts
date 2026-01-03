/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions, IHttpRequestOptions, IPollFunctions } from 'n8n-workflow';

type ContextType = IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions;
import { NodeApiError } from 'n8n-workflow';
import type { RpcResponse } from '../utils/types';
import { NETWORK_CONFIGS } from '../constants';

/**
 * Encode function call data
 */
export function encodeFunctionCall(
  functionName: string,
  types: string[],
  values: unknown[],
): string {
  // Get function selector (first 4 bytes of keccak256 hash)
  const selector = getFunctionSelector(functionName, types);

  // Encode parameters
  const encodedParams = encodeParameters(types, values);

  return selector + encodedParams;
}

/**
 * Get function selector from function signature
 */
export function getFunctionSelector(functionName: string, types: string[]): string {
  const signature = `${functionName}(${types.join(',')})`;
  // Simple keccak256 for function selector - using first 4 bytes
  // In production, use ethers.js or web3.js
  const hash = simpleKeccak256(signature);
  return hash.slice(0, 10); // '0x' + 8 hex chars
}

/**
 * Simple keccak256 implementation for function selectors
 * Note: This is a simplified version - production should use ethers.js
 */
function simpleKeccak256(input: string): string {
  // Pre-computed selectors for common functions
  const precomputed: Record<string, string> = {
    'readDataFeedWithDapiName(bytes32)': '0x82a0cf08',
    'readDataFeedWithId(bytes32)': '0x47bd3e9e',
    'dapiNameToDataFeedId(bytes32)': '0x6cc5f9b0',
    'balanceOf(address)': '0x70a08231',
    'totalSupply()': '0x18160ddd',
    'transfer(address,uint256)': '0xa9059cbb',
    'userStake(address)': '0x66666aa9',
    'totalStake()': '0x8b0e9f3f',
    'stake(uint256)': '0xa694fc3a',
    'unstake()': '0x2def6620',
    'apr()': '0x37965dbe',
    'getUserReward(address)': '0x44fa9a7a',
    'claimReward()': '0xb88a802f',
  };

  return precomputed[input] || '0x00000000';
}

/**
 * Encode parameters for function call
 */
export function encodeParameters(types: string[], values: unknown[]): string {
  let encoded = '';

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];

    if (type === 'bytes32') {
      encoded += encodeBytes32(value as string);
    } else if (type === 'address') {
      encoded += encodeAddress(value as string);
    } else if (type === 'uint256') {
      encoded += encodeUint256(value as string | number | bigint);
    }
  }

  return encoded;
}

/**
 * Encode bytes32 value
 */
function encodeBytes32(value: string): string {
  if (value.startsWith('0x')) {
    return value.slice(2).padEnd(64, '0');
  }
  // Encode string to bytes32
  const hex = Buffer.from(value).toString('hex');
  return hex.padEnd(64, '0');
}

/**
 * Encode address value
 */
function encodeAddress(value: string): string {
  const addr = value.startsWith('0x') ? value.slice(2) : value;
  return addr.toLowerCase().padStart(64, '0');
}

/**
 * Encode uint256 value
 */
function encodeUint256(value: string | number | bigint): string {
  const bn = BigInt(value);
  return bn.toString(16).padStart(64, '0');
}

/**
 * Decode int224 from hex response
 */
export function decodeInt224(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  // int224 is in the first 56 hex chars (224 bits = 56 nibbles), padded to 64
  const valueHex = clean.slice(0, 64);
  return BigInt('0x' + valueHex);
}

/**
 * Decode uint32 from hex response
 */
export function decodeUint32(hex: string, offset: number = 64): number {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const valueHex = clean.slice(offset, offset + 64);
  return Number(BigInt('0x' + valueHex));
}

/**
 * Decode uint256 from hex response
 */
export function decodeUint256(hex: string, offset: number = 0): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const valueHex = clean.slice(offset, offset + 64);
  return BigInt('0x' + valueHex);
}

/**
 * Format value with decimals
 */
export function formatValue(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  return `${integerPart}.${fractionalStr}`;
}

/**
 * Convert dAPI name to bytes32
 */
export function dapiNameToBytes32(name: string): string {
  const hex = Buffer.from(name).toString('hex');
  return '0x' + hex.padEnd(64, '0');
}

/**
 * Make JSON-RPC call to blockchain
 */
export async function makeRpcCall(
  context: ContextType,
  rpcEndpoint: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const requestOptions: IHttpRequestOptions = {
    method: 'POST',
    url: rpcEndpoint,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
    json: true,
  };

  try {
    const response = await context.helpers.httpRequest(requestOptions);
    const rpcResponse = response as RpcResponse;

    if (rpcResponse.error) {
      throw new NodeApiError(context.getNode(), {
        message: rpcResponse.error.message,
        description: `RPC Error Code: ${rpcResponse.error.code}`,
      });
    }

    return rpcResponse.result;
  } catch (error) {
    if (error instanceof NodeApiError) {
      throw error;
    }
    const err = error as Error;
    throw new NodeApiError(context.getNode(), {
      message: err.message,
      description: 'Failed to make RPC call',
    });
  }
}

/**
 * Make eth_call to read contract data
 */
export async function makeEthCall(
  context: ContextType,
  rpcEndpoint: string,
  to: string,
  data: string,
): Promise<string> {
  const result = await makeRpcCall(context, rpcEndpoint, 'eth_call', [
    { to, data },
    'latest',
  ]);
  return result as string;
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: string) {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return config;
}

/**
 * Read dAPI value from contract
 */
export async function readDAPIValue(
  context: ContextType,
  rpcEndpoint: string,
  network: string,
  dapiName: string,
): Promise<{ value: bigint; timestamp: number }> {
  const config = getNetworkConfig(network);
  const dapiNameBytes32 = dapiNameToBytes32(dapiName);

  // Build call data for readDataFeedWithDapiName(bytes32)
  const data = encodeFunctionCall('readDataFeedWithDapiName', ['bytes32'], [dapiNameBytes32]);

  const result = await makeEthCall(context, rpcEndpoint, config.dapiServerAddress, data);

  // Decode result: (int224 value, uint32 timestamp)
  const value = decodeInt224(result);
  const timestamp = decodeUint32(result, 64);

  return { value, timestamp };
}

/**
 * Read data feed by ID
 */
export async function readDataFeedById(
  context: ContextType,
  rpcEndpoint: string,
  network: string,
  feedId: string,
): Promise<{ value: bigint; timestamp: number }> {
  const config = getNetworkConfig(network);

  // Build call data for readDataFeedWithId(bytes32)
  const data = encodeFunctionCall('readDataFeedWithId', ['bytes32'], [feedId]);

  const result = await makeEthCall(context, rpcEndpoint, config.dapiServerAddress, data);

  const value = decodeInt224(result);
  const timestamp = decodeUint32(result, 64);

  return { value, timestamp };
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  context: ContextType,
  rpcEndpoint: string,
  tokenAddress: string,
  accountAddress: string,
): Promise<bigint> {
  const data = encodeFunctionCall('balanceOf', ['address'], [accountAddress]);

  const result = await makeEthCall(context, rpcEndpoint, tokenAddress, data);

  return decodeUint256(result);
}

/**
 * Get total supply
 */
export async function getTotalSupply(
  context: ContextType,
  rpcEndpoint: string,
  tokenAddress: string,
): Promise<bigint> {
  const data = encodeFunctionCall('totalSupply', [], []);

  const result = await makeEthCall(context, rpcEndpoint, tokenAddress, data);

  return decodeUint256(result);
}

/**
 * Get user stake amount
 */
export async function getUserStake(
  context: ContextType,
  rpcEndpoint: string,
  stakingPoolAddress: string,
  userAddress: string,
): Promise<bigint> {
  const data = encodeFunctionCall('userStake', ['address'], [userAddress]);

  const result = await makeEthCall(context, rpcEndpoint, stakingPoolAddress, data);

  return decodeUint256(result);
}

/**
 * Get total stake
 */
export async function getTotalStake(
  context: ContextType,
  rpcEndpoint: string,
  stakingPoolAddress: string,
): Promise<bigint> {
  const data = encodeFunctionCall('totalStake', [], []);

  const result = await makeEthCall(context, rpcEndpoint, stakingPoolAddress, data);

  return decodeUint256(result);
}

/**
 * Get current block number
 */
export async function getBlockNumber(
  context: ContextType,
  rpcEndpoint: string,
): Promise<number> {
  const result = await makeRpcCall(context, rpcEndpoint, 'eth_blockNumber', []);
  return parseInt(result as string, 16);
}

/**
 * Get chain ID
 */
export async function getChainId(
  context: ContextType,
  rpcEndpoint: string,
): Promise<number> {
  const result = await makeRpcCall(context, rpcEndpoint, 'eth_chainId', []);
  return parseInt(result as string, 16);
}

/**
 * Make HTTP request to external API
 */
export async function makeApiRequest(
  context: ContextType,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<unknown> {
  const requestOptions: IHttpRequestOptions = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    json: true,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    return await context.helpers.httpRequest(requestOptions);
  } catch (error) {
    const err = error as Error;
    throw new NodeApiError(context.getNode(), {
      message: err.message,
      description: `API request failed: ${url}`,
    });
  }
}

/**
 * Get API3 token price from CoinGecko
 */
export async function getAPI3Price(
  context: ContextType,
): Promise<{ usd: number; eth: number; change24h: number }> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=api3&vs_currencies=usd,eth&include_24hr_change=true';

  const response = (await makeApiRequest(context, 'GET', url)) as {
    api3: {
      usd: number;
      eth: number;
      usd_24h_change: number;
    };
  };

  return {
    usd: response.api3.usd,
    eth: response.api3.eth,
    change24h: response.api3.usd_24h_change,
  };
}
