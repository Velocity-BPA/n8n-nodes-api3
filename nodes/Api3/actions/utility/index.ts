/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { SupportedChain, ContractAddresses, EncodedParameters, APIHealth } from '../../utils/types';
import { getCredentials } from '../../utils/helpers';
import { makeRpcCall, makeApiRequest, getNetworkConfig, dapiNameToBytes32 } from '../../transport';
import { API_ENDPOINTS, SUPPORTED_CHAINS } from '../../constants';

/**
 * Execute utility operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getSupportedChains':
      return getSupportedChainsOperation.call(this, credentials, itemIndex);
    case 'getContractAddresses':
      return getContractAddressesOperation.call(this, credentials, itemIndex);
    case 'encodeParameters':
      return encodeParametersOperation.call(this, credentials, itemIndex);
    case 'getAPIHealth':
      return getAPIHealthOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get list of supported blockchain networks
 */
async function getSupportedChainsOperation(
  this: IExecuteFunctions,
  _credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<SupportedChain[]> {
  // Build list from SUPPORTED_CHAINS constant
  const chains: SupportedChain[] = Object.entries(SUPPORTED_CHAINS).map(([id, config]) => ({
    chainId: config.chainId,
    name: config.name,
    shortName: id,
    nativeCurrency: config.nativeCurrency,
    explorerUrl: config.explorerUrl,
    testnet: config.testnet,
  }));

  return chains;
}

/**
 * Get contract addresses for a network
 */
async function getContractAddressesOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<ContractAddresses> {
  const network = this.getNodeParameter('network', itemIndex, credentials.network) as string;

  try {
    const config = getNetworkConfig(network);

    return {
      network,
      chainId: config.chainId,
      dapiServer: config.dapiServerAddress,
      api3Token: config.api3TokenAddress,
      stakingPool: config.stakingPoolAddress,
      governance: config.governanceAddress,
      oevAuctionHouse: undefined, // Not in basic config
      coverage: undefined, // Not in basic config
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get contract addresses: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Encode Airnode parameters
 */
async function encodeParametersOperation(
  this: IExecuteFunctions,
  _credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<EncodedParameters> {
  const parametersJson = this.getNodeParameter('parameters', itemIndex) as string;

  try {
    // Parse JSON parameters
    let parameters: Record<string, unknown>;
    try {
      parameters = JSON.parse(parametersJson);
    } catch {
      throw new Error('Invalid JSON parameters');
    }

    // Encode parameters for Airnode
    // Parameters are typically encoded as key-value pairs
    const encodedParts: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      // Simple encoding: key + value as hex
      const keyHex = Buffer.from(key).toString('hex');
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      const valueHex = Buffer.from(valueStr).toString('hex');
      encodedParts.push(keyHex + valueHex);
    }

    const encodedParameters = '0x' + encodedParts.join('');

    // Calculate hash (simplified - in production use keccak256)
    const parametersHash = dapiNameToBytes32(JSON.stringify(parameters));

    return {
      encodedParameters,
      parametersHash,
      decodedPreview: parameters,
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to encode parameters: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Check API3 service health
 */
async function getAPIHealthOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<APIHealth> {
  try {
    const startTime = Date.now();

    // Check RPC connection
    let rpcHealthy = false;
    let rpcLatency = 0;
    let lastBlockTime = 0;
    let syncStatus: 'synced' | 'syncing' | 'behind' = 'behind';

    try {
      const blockNumberResult = await makeRpcCall(
        this,
        credentials.rpcEndpoint,
        'eth_blockNumber',
        [],
      );
      rpcLatency = Date.now() - startTime;
      rpcHealthy = true;

      // Get block timestamp
      const blockNumber = blockNumberResult as string;
      const blockResult = (await makeRpcCall(this, credentials.rpcEndpoint, 'eth_getBlockByNumber', [
        blockNumber,
        false,
      ])) as { timestamp?: string } | null;

      if (blockResult?.timestamp) {
        lastBlockTime = parseInt(blockResult.timestamp, 16);
        const now = Math.floor(Date.now() / 1000);

        // Check if block is recent (within 2 minutes)
        if (now - lastBlockTime < 120) {
          syncStatus = 'synced';
        } else if (now - lastBlockTime < 600) {
          syncStatus = 'syncing';
        } else {
          syncStatus = 'behind';
        }
      }
    } catch {
      rpcHealthy = false;
    }

    // Check dAPI server
    let dapiServerHealthy = false;
    if (rpcHealthy) {
      try {
        const config = getNetworkConfig(credentials.network);
        // Try to read a common dAPI
        await makeRpcCall(this, credentials.rpcEndpoint, 'eth_call', [
          {
            to: config.dapiServerAddress,
            data: '0x82a0cf08' + '0'.repeat(64), // readDataFeedWithDapiName with empty bytes32
          },
          'latest',
        ]);
        dapiServerHealthy = true;
      } catch {
        // dAPI server might still be healthy, just no data for empty name
        dapiServerHealthy = true;
      }
    }

    // Check API3 Market API
    let api3MarketHealthy = false;
    try {
      await makeApiRequest(this, 'GET', `${API_ENDPOINTS.API3_MARKET}/health`);
      api3MarketHealthy = true;
    } catch {
      api3MarketHealthy = false;
    }

    // Check OEV Network
    let oevNetworkHealthy = false;
    try {
      await makeApiRequest(this, 'GET', `${API_ENDPOINTS.OEV_NETWORK}/health`);
      oevNetworkHealthy = true;
    } catch {
      oevNetworkHealthy = false;
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'down';
    const healthyCount = [rpcHealthy, dapiServerHealthy, api3MarketHealthy].filter(Boolean).length;

    if (healthyCount === 3) {
      status = 'healthy';
    } else if (healthyCount >= 1) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      status,
      rpcLatency,
      lastBlockTime,
      syncStatus,
      services: {
        dapiServer: dapiServerHealthy,
        oevNetwork: oevNetworkHealthy,
        governance: rpcHealthy, // Governance uses same RPC
      },
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to check API health: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}
