/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type {
  DataFeedValue,
  DataFeedHistory,
  DataFeedMetadata,
  BeaconData,
} from '../../utils/types';
import { getCredentials, formatWithDecimals, isValidBytes32 } from '../../utils/helpers';
import { readDataFeedById, getNetworkConfig } from '../../transport';
import { DEFAULT_DECIMALS } from '../../constants';

/**
 * Execute Data Feeds operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'readDataFeed':
      return readDataFeedOperation.call(this, credentials, itemIndex);
    case 'getFeedHistory':
      return getFeedHistoryOperation.call(this, credentials, itemIndex);
    case 'getFeedMetadata':
      return getFeedMetadataOperation.call(this, credentials, itemIndex);
    case 'getMultipleFeeds':
      return getMultipleFeedsOperation.call(this, credentials, itemIndex);
    case 'getFeedBeacon':
      return getFeedBeaconOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Read data feed by ID
 */
async function readDataFeedOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DataFeedValue> {
  const feedId = this.getNodeParameter('feedId', itemIndex) as string;

  if (!isValidBytes32(feedId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid feed ID format. Must be a bytes32 value.');
  }

  const { value, timestamp } = await readDataFeedById(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    feedId,
  );

  return {
    feedId,
    value: value.toString(),
    timestamp,
    formattedValue: formatWithDecimals(value, DEFAULT_DECIMALS),
    decimals: DEFAULT_DECIMALS,
  };
}

/**
 * Get feed history
 */
async function getFeedHistoryOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DataFeedHistory> {
  const feedId = this.getNodeParameter('feedId', itemIndex) as string;
  const startTimestamp = this.getNodeParameter('startTimestamp', itemIndex, 0) as number;
  const endTimestamp = this.getNodeParameter('endTimestamp', itemIndex, 0) as number;

  if (!isValidBytes32(feedId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid feed ID format. Must be a bytes32 value.');
  }

  // Note: Historical data requires indexing service or archive node
  // For now, return current value as the only history point
  const { value, timestamp } = await readDataFeedById(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    feedId,
  );

  return {
    feedId,
    values: [
      {
        value: value.toString(),
        timestamp,
        blockNumber: 0, // Would need additional query
      },
    ],
    startTimestamp: startTimestamp || timestamp,
    endTimestamp: endTimestamp || Math.floor(Date.now() / 1000),
  };
}

/**
 * Get feed metadata
 */
async function getFeedMetadataOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DataFeedMetadata> {
  const feedId = this.getNodeParameter('feedId', itemIndex) as string;

  if (!isValidBytes32(feedId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid feed ID format. Must be a bytes32 value.');
  }

  const config = getNetworkConfig(credentials.network);

  return {
    feedId,
    name: `Feed ${feedId.slice(0, 10)}...`,
    description: `Data feed on ${config.name}`,
    category: 'Custom',
    decimals: DEFAULT_DECIMALS,
    createdAt: 0,
    sponsor: '',
  };
}

/**
 * Get multiple feeds
 */
async function getMultipleFeedsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<DataFeedValue[]> {
  const feedIdsStr = this.getNodeParameter('feedIds', itemIndex) as string;
  const feedIds = feedIdsStr.split(',').map((id) => id.trim());

  const results: DataFeedValue[] = [];

  for (const feedId of feedIds) {
    if (!isValidBytes32(feedId)) {
      continue;
    }

    try {
      const { value, timestamp } = await readDataFeedById(
        this,
        credentials.rpcEndpoint,
        credentials.network,
        feedId,
      );

      results.push({
        feedId,
        value: value.toString(),
        timestamp,
        formattedValue: formatWithDecimals(value, DEFAULT_DECIMALS),
        decimals: DEFAULT_DECIMALS,
      });
    } catch (error) {
      // Skip failed feeds
      results.push({
        feedId,
        value: '0',
        timestamp: 0,
        formattedValue: '0',
        decimals: DEFAULT_DECIMALS,
      });
    }
  }

  return results;
}

/**
 * Get feed beacon
 */
async function getFeedBeaconOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<BeaconData> {
  const feedId = this.getNodeParameter('feedId', itemIndex) as string;

  if (!isValidBytes32(feedId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid feed ID format. Must be a bytes32 value.');
  }

  const { value, timestamp } = await readDataFeedById(
    this,
    credentials.rpcEndpoint,
    credentials.network,
    feedId,
  );

  return {
    beaconId: feedId,
    airnodeAddress: '0x0000000000000000000000000000000000000000',
    templateId: feedId,
    value: value.toString(),
    timestamp,
  };
}
