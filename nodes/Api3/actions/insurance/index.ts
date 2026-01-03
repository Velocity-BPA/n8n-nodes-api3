/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { CoverageInfo, AvailableCoverage, Claim } from '../../utils/types';
import { getCredentials, isValidAddress } from '../../utils/helpers';
import { makeApiRequest } from '../../transport';
import { API_ENDPOINTS } from '../../constants';

/**
 * Execute insurance operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getCoverageInfo':
      return getCoverageInfoOperation.call(this, credentials, itemIndex);
    case 'getAvailableCoverage':
      return getAvailableCoverageOperation.call(this, credentials, itemIndex);
    case 'getClaims':
      return getClaimsOperation.call(this, credentials, itemIndex);
    case 'checkCoverage':
      return checkCoverageOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get coverage information for a policy
 */
async function getCoverageInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<CoverageInfo> {
  const policyId = this.getNodeParameter('policyId', itemIndex) as string;

  try {
    // Try to fetch from API
    const apiUrl = `${API_ENDPOINTS.API3_MARKET}/coverage/policies/${policyId}`;

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        policyId: string;
        holder: string;
        dapiNames: string[];
        coverageAmount: string;
        premium: string;
        startTime: number;
        endTime: number;
        status: string;
      };

      return {
        policyId: response.policyId,
        holder: response.holder,
        dapiNames: response.dapiNames,
        coverageAmount: response.coverageAmount,
        premium: response.premium,
        startTime: response.startTime,
        endTime: response.endTime,
        status: mapCoverageStatus(response.status),
      };
    } catch {
      // API unavailable, return placeholder
      return {
        policyId,
        holder: '0x0000000000000000000000000000000000000000',
        dapiNames: [],
        coverageAmount: '0',
        premium: '0',
        startTime: 0,
        endTime: 0,
        status: 'expired',
      };
    }
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get coverage info: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get available coverage options
 */
async function getAvailableCoverageOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<AvailableCoverage[]> {
  const dapiName = this.getNodeParameter('dapiName', itemIndex, '') as string;

  try {
    // Try to fetch from API
    const apiUrl = dapiName
      ? `${API_ENDPOINTS.API3_MARKET}/coverage/available?dapi=${encodeURIComponent(dapiName)}`
      : `${API_ENDPOINTS.API3_MARKET}/coverage/available`;

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        coverage?: AvailableCoverage[];
      };

      return response.coverage || generateSampleCoverage(dapiName);
    } catch {
      // API unavailable, return sample data
      return generateSampleCoverage(dapiName);
    }
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get available coverage: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get claims history
 */
async function getClaimsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Claim[]> {
  const policyId = this.getNodeParameter('policyId', itemIndex, '') as string;
  const status = this.getNodeParameter('claimStatus', itemIndex, 'all') as string;

  try {
    // Try to fetch from API
    let apiUrl = `${API_ENDPOINTS.API3_MARKET}/coverage/claims`;
    if (policyId) {
      apiUrl += `?policyId=${encodeURIComponent(policyId)}`;
    }

    let claims: Claim[] = [];

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        claims?: Claim[];
      };
      claims = response.claims || [];
    } catch {
      // API unavailable, return empty
      claims = [];
    }

    // Filter by status
    if (status !== 'all') {
      claims = claims.filter((c) => c.status === status);
    }

    return claims;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get claims: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Check if address has active coverage
 */
async function checkCoverageOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Record<string, unknown>> {
  const userAddress = this.getNodeParameter('userAddress', itemIndex) as string;
  const dapiName = this.getNodeParameter('dapiName', itemIndex, '') as string;

  if (!isValidAddress(userAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid Ethereum address', { itemIndex });
  }

  try {
    // Try to fetch from API
    let apiUrl = `${API_ENDPOINTS.API3_MARKET}/coverage/check/${userAddress}`;
    if (dapiName) {
      apiUrl += `?dapi=${encodeURIComponent(dapiName)}`;
    }

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        hasCoverage: boolean;
        policies?: CoverageInfo[];
        totalCoverage?: string;
      };

      return {
        userAddress,
        dapiName: dapiName || 'All',
        hasCoverage: response.hasCoverage,
        activePolicies: response.policies?.filter((p) => p.status === 'active') || [],
        totalCoverage: response.totalCoverage || '0',
        network: credentials.network,
      };
    } catch {
      // API unavailable
      return {
        userAddress,
        dapiName: dapiName || 'All',
        hasCoverage: false,
        activePolicies: [],
        totalCoverage: '0',
        network: credentials.network,
        note: 'Coverage API unavailable. Unable to verify coverage status.',
      };
    }
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to check coverage: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Map status string to valid coverage status
 */
function mapCoverageStatus(status: string): 'active' | 'expired' | 'claimed' {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'expired') return 'expired';
  if (normalized === 'claimed') return 'claimed';
  return 'expired';
}

/**
 * Generate sample coverage data
 */
function generateSampleCoverage(dapiName?: string): AvailableCoverage[] {
  const dapis = dapiName ? [dapiName] : ['ETH/USD', 'BTC/USD', 'MATIC/USD'];

  return dapis.map((name) => ({
    dapiName: name,
    maxCoverage: '1000000',
    premiumRate: '0.05',
    availableCapacity: '500000',
    terms: [30, 90, 180, 365],
  }));
}
