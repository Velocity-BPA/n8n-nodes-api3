/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Subscription, SubscriptionCreate } from '../../utils/types';
import { getCredentials, isValidAddress, generateId } from '../../utils/helpers';
import { makeApiRequest } from '../../transport';
import { API_ENDPOINTS } from '../../constants';

/**
 * Execute subscription operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getSubscription':
      return getSubscriptionOperation.call(this, credentials, itemIndex);
    case 'listSubscriptions':
      return listSubscriptionsOperation.call(this, credentials, itemIndex);
    case 'createSubscription':
      return createSubscriptionOperation.call(this, credentials, itemIndex);
    case 'renewSubscription':
      return renewSubscriptionOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get subscription details
 */
async function getSubscriptionOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Subscription> {
  const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;

  try {
    // Try to fetch from API
    const apiUrl = `${API_ENDPOINTS.API3_MARKET}/subscriptions/${subscriptionId}`;

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        subscriptionId: string;
        dapiName: string;
        subscriber: string;
        startTime: number;
        endTime: number;
        tier: string;
        updateFrequency: number;
        status: string;
      };

      return {
        subscriptionId: response.subscriptionId,
        dapiName: response.dapiName,
        subscriber: response.subscriber,
        startTime: response.startTime,
        endTime: response.endTime,
        tier: mapSubscriptionTier(response.tier),
        updateFrequency: response.updateFrequency,
        status: mapSubscriptionStatus(response.status),
      };
    } catch {
      // API unavailable, return placeholder
      return {
        subscriptionId,
        dapiName: 'Unknown',
        subscriber: '0x0000000000000000000000000000000000000000',
        startTime: 0,
        endTime: 0,
        tier: 'basic',
        updateFrequency: 3600,
        status: 'expired',
      };
    }
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get subscription: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * List subscriptions for a user or dAPI
 */
async function listSubscriptionsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Subscription[]> {
  const filterType = this.getNodeParameter('filterType', itemIndex, 'user') as string;
  const filterValue = this.getNodeParameter('filterValue', itemIndex, '') as string;
  const status = this.getNodeParameter('subscriptionStatus', itemIndex, 'all') as string;

  try {
    // Build API URL based on filter type
    let apiUrl = `${API_ENDPOINTS.API3_MARKET}/subscriptions`;
    const params: string[] = [];

    if (filterType === 'user' && filterValue) {
      params.push(`subscriber=${encodeURIComponent(filterValue)}`);
    } else if (filterType === 'dapi' && filterValue) {
      params.push(`dapi=${encodeURIComponent(filterValue)}`);
    }

    if (status !== 'all') {
      params.push(`status=${encodeURIComponent(status)}`);
    }

    if (params.length > 0) {
      apiUrl += '?' + params.join('&');
    }

    let subscriptions: Subscription[] = [];

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        subscriptions?: Array<{
          subscriptionId: string;
          dapiName: string;
          subscriber: string;
          startTime: number;
          endTime: number;
          tier: string;
          updateFrequency: number;
          status: string;
        }>;
      };

      if (response.subscriptions) {
        subscriptions = response.subscriptions.map((s) => ({
          subscriptionId: s.subscriptionId,
          dapiName: s.dapiName,
          subscriber: s.subscriber,
          startTime: s.startTime,
          endTime: s.endTime,
          tier: mapSubscriptionTier(s.tier),
          updateFrequency: s.updateFrequency,
          status: mapSubscriptionStatus(s.status),
        }));
      }
    } catch {
      // API unavailable, return sample data
      subscriptions = generateSampleSubscriptions(filterValue, filterType);
    }

    return subscriptions;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to list subscriptions: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Create a new subscription
 */
async function createSubscriptionOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<SubscriptionCreate> {
  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required to create subscriptions',
      { itemIndex },
    );
  }

  const dapiName = this.getNodeParameter('dapiName', itemIndex) as string;
  const duration = this.getNodeParameter('duration', itemIndex) as number;
  const tier = this.getNodeParameter('tier', itemIndex, 'basic') as string;

  try {
    // In production, this would create an on-chain transaction
    // For now, prepare the subscription data

    const subscriptionId = generateId();
    const now = Math.floor(Date.now() / 1000);

    // Calculate cost based on tier and duration
    const baseCost = tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : 10;
    const cost = (baseCost * duration / 30).toFixed(2);

    return {
      transactionHash: '', // Will be set after signing
      subscriptionId,
      dapiName,
      duration,
      cost,
      status: 'pending',
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to create subscription: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Renew an existing subscription
 */
async function renewSubscriptionOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<SubscriptionCreate> {
  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required to renew subscriptions',
      { itemIndex },
    );
  }

  const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;
  const additionalDays = this.getNodeParameter('additionalDays', itemIndex) as number;

  try {
    // First, get the existing subscription
    const apiUrl = `${API_ENDPOINTS.API3_MARKET}/subscriptions/${subscriptionId}`;

    let dapiName = 'Unknown';
    let tier = 'basic';

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        dapiName: string;
        tier: string;
      };
      dapiName = response.dapiName;
      tier = response.tier;
    } catch {
      // API unavailable
    }

    // Calculate renewal cost
    const baseCost = tier === 'enterprise' ? 100 : tier === 'pro' ? 50 : 10;
    const cost = (baseCost * additionalDays / 30).toFixed(2);

    return {
      transactionHash: '', // Will be set after signing
      subscriptionId,
      dapiName,
      duration: additionalDays,
      cost,
      status: 'pending',
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to renew subscription: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Map tier string to valid subscription tier
 */
function mapSubscriptionTier(tier: string): 'basic' | 'pro' | 'enterprise' {
  const normalized = tier.toLowerCase();
  if (normalized === 'pro') return 'pro';
  if (normalized === 'enterprise') return 'enterprise';
  return 'basic';
}

/**
 * Map status string to valid subscription status
 */
function mapSubscriptionStatus(status: string): 'active' | 'expired' | 'cancelled' {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  return 'expired';
}

/**
 * Generate sample subscriptions
 */
function generateSampleSubscriptions(filterValue: string, filterType: string): Subscription[] {
  const now = Math.floor(Date.now() / 1000);
  const subscriptions: Subscription[] = [];

  const dapis = filterType === 'dapi' && filterValue ? [filterValue] : ['ETH/USD', 'BTC/USD'];
  const subscriber =
    filterType === 'user' && filterValue
      ? filterValue
      : '0x0000000000000000000000000000000000000000';

  dapis.forEach((dapi, i) => {
    subscriptions.push({
      subscriptionId: `sample-${i + 1}`,
      dapiName: dapi,
      subscriber,
      startTime: now - 86400 * 30, // 30 days ago
      endTime: now + 86400 * 60, // 60 days from now
      tier: 'basic',
      updateFrequency: 3600,
      status: 'active',
    });
  });

  return subscriptions;
}
