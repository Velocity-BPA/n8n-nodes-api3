/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type {
  DAPIValue,
  DAPIInfo,
  DAPIListItem,
  DAPIUpdateInfo,
  DAPIDeviation,
  DAPISource,
} from '../../utils/types';
import { getCredentials, formatWithDecimals, getDAPIDecimals } from '../../utils/helpers';
import { readDAPIValue, getNetworkConfig, dapiNameToBytes32 } from '../../transport';
import { COMMON_DAPIS, DEFAULT_DECIMALS } from '../../constants';

/**
 * Execute dAPIs operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getDAPIValue':
      return getDAPIValueOperation.call(this, credentials, itemIndex);
    case 'getDAPIInfo':
      return getDAPIInfoOperation.call(this, credentials, itemIndex);
    case 'listDAPIs':
      return listDAPIsOperation.call(this, credentials, itemIndex);
    case 'getDAPIUpdateTime':
      return getDAPIUpdateTimeOperation.call(this, credentials, itemIndex);
    case 'getDAPIDeviation':
      return getDAPIDeviationOperation.call(this, credentials, itemIndex);
    case 'getDAPISources':
      return getDAPISourcesOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get current dAPI value
 */
async function getDAPIValueOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DAPIValue> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;
  const decimals = getDAPIDecimals(dapiName);

  const { value, timestamp } = await readDAPIValue(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    dapiName,
  );

  const formattedValue = formatWithDecimals(value, decimals);

  return {
    value: value.toString(),
    timestamp,
    dapiName,
    network: credentials.network,
    formattedValue,
    decimals,
  };
}

/**
 * Get dAPI info
 */
async function getDAPIInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DAPIInfo> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;
  const config = getNetworkConfig(credentials.network);

  // Read the current value to get timestamp
  const { value, timestamp } = await readDAPIValue(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    dapiName,
  );

  // Parse dAPI name for category
  const parts = dapiName.split('/');
  const category = parts.length > 1 ? 'Price Feed' : 'Custom';

  return {
    name: dapiName,
    category,
    description: `${dapiName} price feed on ${config.name}`,
    decimals: DEFAULT_DECIMALS,
    deviation: '1%', // Default deviation threshold
    heartbeat: 86400, // 24 hours default heartbeat
    sources: [], // Would need additional API call to get sources
    sponsorWallet: '', // Would need additional API call
    network: credentials.network,
    contractAddress: config.dapiServerAddress,
    lastUpdated: timestamp,
  };
}

/**
 * List available dAPIs
 */
async function listDAPIsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<DAPIListItem[]> {
  // Return common dAPIs with availability check
  const dapis: DAPIListItem[] = [];

  for (const name of COMMON_DAPIS) {
    try {
      const { value, timestamp } = await readDAPIValue(
        this,
        credentials.rpcEndpoint,
        credentials.network,
        name,
      );

      const isActive = timestamp > 0 && value !== BigInt(0);

      dapis.push({
        name,
        category: 'Price Feed',
        network: credentials.network,
        active: isActive,
        price: isActive ? formatWithDecimals(value, DEFAULT_DECIMALS) : undefined,
      });
    } catch {
      // dAPI not available on this network
      dapis.push({
        name,
        category: 'Price Feed',
        network: credentials.network,
        active: false,
      });
    }
  }

  return dapis;
}

/**
 * Get dAPI update time
 */
async function getDAPIUpdateTimeOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DAPIUpdateInfo> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;

  const { timestamp } = await readDAPIValue(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    dapiName,
  );

  const heartbeatSeconds = 86400; // 24 hours default
  const nextExpectedUpdate = timestamp + heartbeatSeconds;

  return {
    lastUpdateTimestamp: timestamp,
    nextExpectedUpdate,
    heartbeatSeconds,
    lastUpdateBlock: 0, // Would need additional query
  };
}

/**
 * Get dAPI deviation threshold
 */
async function getDAPIDeviationOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DAPIDeviation> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;

  // Default deviation thresholds (would need API3 Market API for actual values)
  return {
    deviationThresholdPercent: '1.0',
    currentDeviation: '0.0',
    lastUpdateReason: 'heartbeat',
  };
}

/**
 * Get dAPI sources
 */
async function getDAPISourcesOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DAPISource[]> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;

  // This would need API3 Market API to get actual sources
  // For now, return placeholder data
  return [
    {
      airnodeName: 'API3 Data Provider',
      airnodeAddress: '0x0000000000000000000000000000000000000000',
      endpointId: dapiNameToBytes32(dapiName),
      templateId: dapiNameToBytes32(dapiName + '_template'),
      lastValue: '0',
      lastTimestamp: Math.floor(Date.now() / 1000),
    },
  ];
}
