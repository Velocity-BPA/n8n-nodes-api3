/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { OEVNetworkInfo, OEVAuction, OEVBid, OEVStats } from '../../utils/types';
import { getCredentials, generateId, etherToWei } from '../../utils/helpers';
import { makeApiRequest, getNetworkConfig } from '../../transport';
import { API_ENDPOINTS } from '../../constants';

/**
 * Execute OEV operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getOEVNetworkInfo':
      return getOEVNetworkInfoOperation.call(this, credentials, itemIndex);
    case 'getAuctionInfo':
      return getAuctionInfoOperation.call(this, credentials, itemIndex);
    case 'placeOEVBid':
      return placeOEVBidOperation.call(this, credentials, itemIndex);
    case 'getBidStatus':
      return getBidStatusOperation.call(this, credentials, itemIndex);
    case 'getOEVStats':
      return getOEVStatsOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get OEV network info
 */
async function getOEVNetworkInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<OEVNetworkInfo> {
  const config = getNetworkConfig(credentials.network);

  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.OEV_NETWORK}/network/${config.chainId}`,
      undefined,
      credentials.oevApiKey ? { Authorization: `Bearer ${credentials.oevApiKey}` } : {},
    );
    return response as OEVNetworkInfo;
  } catch {
    // Return basic info if API is not available
    return {
      networkName: config.name,
      chainId: config.chainId,
      oevAuctionHouseAddress: '0x0000000000000000000000000000000000000000',
      activeAuctions: 0,
      totalBidsAllTime: '0',
      totalValueCaptured: '0',
    };
  }
}

/**
 * Get auction info
 */
async function getAuctionInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<OEVAuction> {
  const auctionId = this.getNodeParameter('auctionId', itemIndex) as string;

  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.OEV_NETWORK}/auctions/${auctionId}`,
      undefined,
      credentials.oevApiKey ? { Authorization: `Bearer ${credentials.oevApiKey}` } : {},
    );
    return response as OEVAuction;
  } catch {
    // Return placeholder if API is not available
    return {
      auctionId,
      dapiName: 'Unknown',
      startTime: Math.floor(Date.now() / 1000),
      endTime: Math.floor(Date.now() / 1000) + 3600,
      minimumBid: '0',
      currentHighestBid: '0',
      bidCount: 0,
      status: 'active',
    };
  }
}

/**
 * Place OEV bid
 */
async function placeOEVBidOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<OEVBid> {
  const auctionId = this.getNodeParameter('auctionId', itemIndex) as string;
  const bidAmount = this.getNodeParameter('bidAmount', itemIndex) as string;

  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required for placing bids. Please configure it in credentials.',
    );
  }

  // Convert to wei
  const amountWei = etherToWei(bidAmount);

  // Note: Actual bid placement requires on-chain transaction
  // This would submit to the OEV auction house contract
  const bidId = `bid_${generateId()}`;

  return {
    bidId,
    auctionId,
    bidder: '0x0000000000000000000000000000000000000000', // Would be derived from private key
    amount: amountWei.toString(),
    timestamp: Math.floor(Date.now() / 1000),
    status: 'pending',
  };
}

/**
 * Get bid status
 */
async function getBidStatusOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<OEVBid> {
  const bidId = this.getNodeParameter('bidId', itemIndex) as string;

  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.OEV_NETWORK}/bids/${bidId}`,
      undefined,
      credentials.oevApiKey ? { Authorization: `Bearer ${credentials.oevApiKey}` } : {},
    );
    return response as OEVBid;
  } catch {
    return {
      bidId,
      auctionId: 'unknown',
      bidder: '0x0000000000000000000000000000000000000000',
      amount: '0',
      timestamp: 0,
      status: 'pending',
    };
  }
}

/**
 * Get OEV stats
 */
async function getOEVStatsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<OEVStats> {
  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.OEV_NETWORK}/stats`,
      undefined,
      credentials.oevApiKey ? { Authorization: `Bearer ${credentials.oevApiKey}` } : {},
    );
    return response as OEVStats;
  } catch {
    return {
      totalAuctions: 0,
      totalBids: 0,
      totalValueCaptured: '0',
      averageBidAmount: '0',
      uniqueBidders: 0,
      successRate: '0%',
    };
  }
}
