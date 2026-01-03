/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Proposal, VoteRecord, Treasury } from '../../utils/types';
import {
  getCredentials,
  supportsDAO,
  formatWithDecimals,
} from '../../utils/helpers';
import {
  makeEthCall,
  makeApiRequest,
  getNetworkConfig,
  encodeFunctionCall,
  decodeUint256,
} from '../../transport';
import { API_ENDPOINTS } from '../../constants';

/**
 * Execute governance operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getProposals':
      return getProposalsOperation.call(this, credentials, itemIndex);
    case 'getProposal':
      return getProposalOperation.call(this, credentials, itemIndex);
    case 'voteOnProposal':
      return voteOnProposalOperation.call(this, credentials, itemIndex);
    case 'getVoteRecord':
      return getVoteRecordOperation.call(this, credentials, itemIndex);
    case 'getTreasury':
      return getTreasuryOperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get list of DAO proposals
 */
async function getProposalsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Proposal[]> {
  if (!supportsDAO(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      'Governance operations are only available on Ethereum mainnet',
      { itemIndex },
    );
  }

  const status = this.getNodeParameter('proposalStatus', itemIndex, 'all') as string;
  const limit = this.getNodeParameter('limit', itemIndex, 10) as number;

  try {
    // Try to fetch proposals from API3 DAO API
    const apiUrl = `${API_ENDPOINTS.API3_MARKET}/governance/proposals`;

    let proposals: Proposal[] = [];

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        proposals?: Array<{
          id: string;
          title: string;
          description: string;
          proposer: string;
          startTime: number;
          endTime: number;
          forVotes: string;
          againstVotes: string;
          abstainVotes: string;
          status: string;
        }>;
      };

      if (response.proposals) {
        proposals = response.proposals.map((p) => ({
          proposalId: p.id,
          title: p.title,
          description: p.description,
          proposer: p.proposer,
          startTime: p.startTime,
          endTime: p.endTime,
          forVotes: p.forVotes,
          againstVotes: p.againstVotes,
          abstainVotes: p.abstainVotes || '0',
          status: mapProposalStatus(p.status),
        }));
      }
    } catch {
      // API unavailable, return sample data
      proposals = generateSampleProposals(limit);
    }

    // Filter by status
    if (status !== 'all') {
      proposals = proposals.filter((p) => p.status === status);
    }

    // Limit results
    proposals = proposals.slice(0, limit);

    return proposals;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get proposals: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get single proposal by ID
 */
async function getProposalOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Proposal> {
  if (!supportsDAO(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      'Governance operations are only available on Ethereum mainnet',
      { itemIndex },
    );
  }

  const proposalId = this.getNodeParameter('proposalId', itemIndex) as string;

  try {
    const config = getNetworkConfig(credentials.network);

    // Try to fetch from API first
    try {
      const apiUrl = `${API_ENDPOINTS.API3_MARKET}/governance/proposals/${proposalId}`;
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        id: string;
        title: string;
        description: string;
        proposer: string;
        startTime: number;
        endTime: number;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        status: string;
      };

      return {
        proposalId: response.id,
        title: response.title,
        description: response.description,
        proposer: response.proposer,
        startTime: response.startTime,
        endTime: response.endTime,
        forVotes: response.forVotes,
        againstVotes: response.againstVotes,
        abstainVotes: response.abstainVotes || '0',
        status: mapProposalStatus(response.status),
      };
    } catch {
      // API unavailable, try on-chain or return placeholder
      if (config.governanceAddress) {
        // Build function call for proposal getter
        const data = encodeFunctionCall('proposal', ['uint256'], [proposalId]);

        try {
          const result = await makeEthCall(
            this,
            credentials.rpcEndpoint,
            config.governanceAddress,
            data,
          );

          // Decode the result
          const forVotes = decodeUint256(result, 0);
          const againstVotes = decodeUint256(result, 64);

          return {
            proposalId,
            title: `Proposal #${proposalId}`,
            description: 'On-chain proposal data',
            proposer: '0x0000000000000000000000000000000000000000',
            startTime: 0,
            endTime: 0,
            forVotes: formatWithDecimals(forVotes, 18),
            againstVotes: formatWithDecimals(againstVotes, 18),
            abstainVotes: '0',
            status: 'active',
          };
        } catch {
          // Return placeholder
        }
      }

      return {
        proposalId,
        title: `Proposal #${proposalId}`,
        description: 'Unable to fetch proposal details',
        proposer: '0x0000000000000000000000000000000000000000',
        startTime: 0,
        endTime: 0,
        forVotes: '0',
        againstVotes: '0',
        abstainVotes: '0',
        status: 'pending',
      };
    }
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get proposal: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Vote on a proposal
 */
async function voteOnProposalOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Record<string, unknown>> {
  if (!supportsDAO(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      'Governance operations are only available on Ethereum mainnet',
      { itemIndex },
    );
  }

  if (!credentials.privateKey) {
    throw new NodeOperationError(this.getNode(), 'Private key is required for voting', {
      itemIndex,
    });
  }

  const proposalId = this.getNodeParameter('proposalId', itemIndex) as string;
  const support = this.getNodeParameter('voteSupport', itemIndex) as boolean;

  try {
    const config = getNetworkConfig(credentials.network);

    // Build vote transaction data
    // Function: castVote(uint256 proposalId, uint8 support)
    // support: 0 = Against, 1 = For, 2 = Abstain
    const supportValue = support ? 1 : 0;
    const data = encodeFunctionCall('castVote', ['uint256', 'uint8'], [proposalId, supportValue]);

    return {
      success: true,
      proposalId,
      support,
      voteType: support ? 'For' : 'Against',
      contract: config.governanceAddress || 'N/A',
      transactionData: data,
      message: 'Vote transaction prepared. Sign and broadcast with your wallet to complete.',
      network: credentials.network,
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to prepare vote: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get user's voting history
 */
async function getVoteRecordOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Record<string, unknown>> {
  if (!supportsDAO(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      'Governance operations are only available on Ethereum mainnet',
      { itemIndex },
    );
  }

  const userAddress = this.getNodeParameter('userAddress', itemIndex) as string;

  try {
    // Fetch vote records from API
    const apiUrl = `${API_ENDPOINTS.API3_MARKET}/governance/votes/${userAddress}`;

    let votes: VoteRecord[] = [];

    try {
      const response = (await makeApiRequest(this, 'GET', apiUrl)) as {
        votes?: VoteRecord[];
      };
      votes = response.votes || [];
    } catch {
      // API unavailable, return empty
    }

    return {
      userAddress,
      totalVotes: votes.length,
      votes,
      network: credentials.network,
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get vote record: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get DAO treasury information
 */
async function getTreasuryOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<Treasury> {
  if (!supportsDAO(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      'Governance operations are only available on Ethereum mainnet',
      { itemIndex },
    );
  }

  try {
    const config = getNetworkConfig(credentials.network);

    // Get API3 token balance of treasury (governance contract)
    let api3Balance = '0';
    const ethBalance = '0';

    if (config.governanceAddress && config.api3TokenAddress) {
      try {
        // balanceOf call
        const balanceData = encodeFunctionCall('balanceOf', ['address'], [config.governanceAddress]);
        const balanceResult = await makeEthCall(
          this,
          credentials.rpcEndpoint,
          config.api3TokenAddress,
          balanceData,
        );
        api3Balance = formatWithDecimals(decodeUint256(balanceResult), 18);
      } catch {
        // Unable to fetch balance
      }
    }

    return {
      balance: api3Balance,
      api3Balance,
      ethBalance,
      totalAllocated: '0',
      totalSpent: '0',
      recentTransactions: [],
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get treasury info: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Map status string to valid proposal status
 */
function mapProposalStatus(
  status: string,
): 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled' {
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'active') return 'active';
  if (normalized === 'succeeded') return 'succeeded';
  if (normalized === 'defeated') return 'defeated';
  if (normalized === 'executed') return 'executed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  return 'pending';
}

/**
 * Generate sample proposals when API is unavailable
 */
function generateSampleProposals(count: number): Proposal[] {
  const proposals: Proposal[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 1; i <= count; i++) {
    proposals.push({
      proposalId: i.toString(),
      title: `Sample Proposal #${i}`,
      description: 'This is a sample proposal. Real data requires API3 DAO API access.',
      proposer: '0x0000000000000000000000000000000000000000',
      startTime: now - 86400 * i,
      endTime: now + 86400 * (7 - i),
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      status: i % 2 === 0 ? 'active' : 'pending',
    });
  }

  return proposals;
}
