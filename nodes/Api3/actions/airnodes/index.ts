/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { AirnodeInfo, AirnodeEndpoint, AirnodeRequest } from '../../utils/types';
import { getCredentials, isValidAddress, isValidBytes32, generateId } from '../../utils/helpers';
import { makeApiRequest } from '../../transport';
import { API_ENDPOINTS } from '../../constants';

/**
 * Execute Airnodes operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getAirnodeInfo':
      return getAirnodeInfoOperation.call(this, credentials, itemIndex);
    case 'listAirnodes':
      return listAirnodesOperation.call(this, credentials, itemIndex);
    case 'getAirnodeEndpoints':
      return getAirnodeEndpointsOperation.call(this, credentials, itemIndex);
    case 'makeAirnodeRequest':
      return makeAirnodeRequestOperation.call(this, credentials, itemIndex);
    case 'getRequestStatus':
      return getRequestStatusOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get Airnode info
 */
async function getAirnodeInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<AirnodeInfo> {
  const airnodeAddress = this.getNodeParameter('airnodeAddress', itemIndex) as string;

  if (!isValidAddress(airnodeAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid Airnode address format.');
  }

  // Try to get info from API3 Market API
  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.API3_MARKET}/airnodes/${airnodeAddress}`,
      undefined,
      credentials.api3MarketApiKey ? { Authorization: `Bearer ${credentials.api3MarketApiKey}` } : {},
    );
    return response as AirnodeInfo;
  } catch {
    // Return basic info if API is not available
    return {
      airnodeAddress,
      name: `Airnode ${airnodeAddress.slice(0, 10)}...`,
      description: 'First-party oracle node',
      homeUrl: '',
      logoUrl: '',
      xpub: '',
      endpoints: 0,
      chains: [credentials.network],
      stage: 'unknown',
    };
  }
}

/**
 * List available Airnodes
 */
async function listAirnodesOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<AirnodeInfo[]> {
  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.API3_MARKET}/airnodes`,
      undefined,
      credentials.api3MarketApiKey ? { Authorization: `Bearer ${credentials.api3MarketApiKey}` } : {},
    );
    return response as AirnodeInfo[];
  } catch {
    // Return empty list if API is not available
    return [];
  }
}

/**
 * Get Airnode endpoints
 */
async function getAirnodeEndpointsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<AirnodeEndpoint[]> {
  const airnodeAddress = this.getNodeParameter('airnodeAddress', itemIndex) as string;

  if (!isValidAddress(airnodeAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid Airnode address format.');
  }

  try {
    const response = await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.API3_MARKET}/airnodes/${airnodeAddress}/endpoints`,
      undefined,
      credentials.api3MarketApiKey ? { Authorization: `Bearer ${credentials.api3MarketApiKey}` } : {},
    );
    return response as AirnodeEndpoint[];
  } catch {
    // Return empty list if API is not available
    return [];
  }
}

/**
 * Make Airnode request
 */
async function makeAirnodeRequestOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<AirnodeRequest> {
  const airnodeAddress = this.getNodeParameter('airnodeAddress', itemIndex) as string;
  const endpointId = this.getNodeParameter('endpointId', itemIndex) as string;
  const parametersStr = this.getNodeParameter('parameters', itemIndex, '{}') as string;

  if (!isValidAddress(airnodeAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid Airnode address format.');
  }

  if (!isValidBytes32(endpointId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid endpoint ID format. Must be bytes32.');
  }

  let parameters: Record<string, unknown>;
  try {
    parameters = JSON.parse(parametersStr);
  } catch {
    throw new NodeOperationError(this.getNode(), 'Invalid parameters JSON format.');
  }

  // Note: Actual Airnode requests require on-chain transactions
  // This would need the requester contract and sponsor wallet setup
  const requestId = `0x${generateId().replace(/-/g, '').padEnd(64, '0')}`;

  return {
    requestId,
    airnodeAddress,
    endpointId,
    parameters,
    status: 'pending',
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * Get request status
 */
async function getRequestStatusOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<AirnodeRequest> {
  const requestId = this.getNodeParameter('requestId', itemIndex) as string;

  if (!isValidBytes32(requestId)) {
    throw new NodeOperationError(this.getNode(), 'Invalid request ID format. Must be bytes32.');
  }

  // Note: Would need to query RrpBeaconServer contract events
  return {
    requestId,
    airnodeAddress: '0x0000000000000000000000000000000000000000',
    endpointId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    parameters: {},
    status: 'pending',
    timestamp: Math.floor(Date.now() / 1000),
  };
}
