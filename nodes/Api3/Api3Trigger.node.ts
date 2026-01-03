/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { readDAPIValue, makeApiRequest, getNetworkConfig } from './transport';
import { formatTimestamp, normalizeDAPIName, formatWithDecimals } from './utils/helpers';
import { COMMON_DAPIS, API_ENDPOINTS, DEFAULT_DECIMALS, LICENSING_NOTICE } from './constants';

// Track if licensing notice has been logged
let licensingNoticeLogged = false;

export class Api3Trigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'API3 Trigger',
    name: 'api3Trigger',
    icon: 'file:api3.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["triggerType"]}}',
    description: 'Triggers on API3 oracle events',
    defaults: {
      name: 'API3 Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'api3Credentials',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Trigger Type',
        name: 'triggerType',
        type: 'options',
        options: [
          {
            name: 'dAPI Price Update',
            value: 'dAPIPriceUpdate',
            description: 'Trigger when a dAPI price feed is updated',
          },
          {
            name: 'dAPI Deviation Threshold',
            value: 'dAPIDeviationThreshold',
            description: 'Trigger when price moves beyond threshold',
          },
          {
            name: 'OEV Auction Started',
            value: 'oevAuctionStarted',
            description: 'Trigger when a new OEV auction begins',
          },
          {
            name: 'Governance Proposal',
            value: 'governanceProposal',
            description: 'Trigger when a new DAO proposal is created',
          },
          {
            name: 'Stake Reward Available',
            value: 'stakeRewardAvailable',
            description: 'Trigger when staking rewards are available',
          },
        ],
        default: 'dAPIPriceUpdate',
        required: true,
      },
      // dAPI Price Update options
      {
        displayName: 'dAPI Name',
        name: 'dapiName',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getDAPIOptions',
        },
        default: 'ETH/USD',
        required: true,
        displayOptions: {
          show: {
            triggerType: ['dAPIPriceUpdate', 'dAPIDeviationThreshold'],
          },
        },
        description: 'The dAPI price feed to monitor',
      },
      {
        displayName: 'Custom dAPI Name',
        name: 'customDapiName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            triggerType: ['dAPIPriceUpdate', 'dAPIDeviationThreshold'],
          },
        },
        description: 'Enter a custom dAPI name if not in the list above',
      },
      // Deviation threshold options
      {
        displayName: 'Deviation Threshold (%)',
        name: 'deviationThreshold',
        type: 'number',
        typeOptions: {
          minValue: 0.1,
          maxValue: 100,
          numberPrecision: 2,
        },
        default: 1,
        displayOptions: {
          show: {
            triggerType: ['dAPIDeviationThreshold'],
          },
        },
        description: 'Trigger when price deviates by this percentage from baseline',
      },
      // User address for stake rewards
      {
        displayName: 'User Address',
        name: 'userAddress',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            triggerType: ['stakeRewardAvailable'],
          },
        },
        description: 'Ethereum address to check for staking rewards',
      },
      // Minimum reward threshold
      {
        displayName: 'Minimum Reward (API3)',
        name: 'minReward',
        type: 'number',
        typeOptions: {
          minValue: 0,
          numberPrecision: 4,
        },
        default: 0.01,
        displayOptions: {
          show: {
            triggerType: ['stakeRewardAvailable'],
          },
        },
        description: 'Minimum reward amount to trigger',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getDAPIOptions() {
        return COMMON_DAPIS.map((dapi) => ({
          name: dapi,
          value: dapi,
        }));
      },
    },
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    // Log licensing notice on first poll
    if (!licensingNoticeLogged) {
      console.warn(LICENSING_NOTICE);
      licensingNoticeLogged = true;
    }

    const triggerType = this.getNodeParameter('triggerType') as string;
    const credentials = await this.getCredentials('api3Credentials');

    const pollData = this.getWorkflowStaticData('node');

    try {
      switch (triggerType) {
        case 'dAPIPriceUpdate':
          return await pollDAPIPriceUpdate.call(this, credentials, pollData);
        case 'dAPIDeviationThreshold':
          return await pollDAPIDeviationThreshold.call(this, credentials, pollData);
        case 'oevAuctionStarted':
          return await pollOEVAuctionStarted.call(this, credentials, pollData);
        case 'governanceProposal':
          return await pollGovernanceProposal.call(this, credentials, pollData);
        case 'stakeRewardAvailable':
          return await pollStakeRewardAvailable.call(this, credentials, pollData);
        default:
          throw new NodeOperationError(this.getNode(), `Unknown trigger type: ${triggerType}`);
      }
    } catch (error) {
      throw new NodeOperationError(this.getNode(), `Trigger error: ${(error as Error).message}`);
    }
  }
}

/**
 * Poll for dAPI price updates
 */
async function pollDAPIPriceUpdate(
  this: IPollFunctions,
  credentials: IDataObject,
  pollData: IDataObject,
): Promise<INodeExecutionData[][] | null> {
  const network = credentials.network as string;
  const rpcEndpoint = credentials.rpcEndpoint as string;
  const dapiName = this.getNodeParameter('dapiName') as string;
  const customDapiName = this.getNodeParameter('customDapiName', '') as string;

  const effectiveDapiName = customDapiName || dapiName;
  const normalizedName = normalizeDAPIName(effectiveDapiName);

  // Read current dAPI value
  const dapiValue = await readDAPIValue(this, rpcEndpoint, network, normalizedName);

  const lastTimestamp = pollData[`lastTimestamp_${normalizedName}`] as number | undefined;
  const currentTimestamp = dapiValue.timestamp;
  const formattedValue = formatWithDecimals(dapiValue.value, DEFAULT_DECIMALS);

  // Check if value was updated
  if (lastTimestamp && currentTimestamp > lastTimestamp) {
    // Store new timestamp
    pollData[`lastTimestamp_${normalizedName}`] = currentTimestamp;
    pollData[`lastValue_${normalizedName}`] = dapiValue.value.toString();

    return [
      [
        {
          json: {
            event: 'dAPIPriceUpdate',
            dapiName: normalizedName,
            value: dapiValue.value.toString(),
            formattedValue,
            previousTimestamp: lastTimestamp,
            timestamp: currentTimestamp,
            timestampISO: formatTimestamp(currentTimestamp),
            network,
          },
        },
      ],
    ];
  }

  // Store current values for next poll
  pollData[`lastTimestamp_${normalizedName}`] = currentTimestamp;
  pollData[`lastValue_${normalizedName}`] = dapiValue.value.toString();

  return null;
}

/**
 * Poll for dAPI deviation threshold
 */
async function pollDAPIDeviationThreshold(
  this: IPollFunctions,
  credentials: IDataObject,
  pollData: IDataObject,
): Promise<INodeExecutionData[][] | null> {
  const network = credentials.network as string;
  const rpcEndpoint = credentials.rpcEndpoint as string;
  const dapiName = this.getNodeParameter('dapiName') as string;
  const customDapiName = this.getNodeParameter('customDapiName', '') as string;
  const threshold = this.getNodeParameter('deviationThreshold') as number;

  const effectiveDapiName = customDapiName || dapiName;
  const normalizedName = normalizeDAPIName(effectiveDapiName);

  // Read current dAPI value
  const dapiValue = await readDAPIValue(this, rpcEndpoint, network, normalizedName);

  const formattedValue = formatWithDecimals(dapiValue.value, DEFAULT_DECIMALS);
  const lastValue = pollData[`baseValue_${normalizedName}`] as string | undefined;

  if (lastValue) {
    const lastNum = parseFloat(lastValue);
    const currentNum = parseFloat(formattedValue);
    const deviation = Math.abs((currentNum - lastNum) / lastNum) * 100;

    if (deviation >= threshold) {
      // Update baseline to current value
      pollData[`baseValue_${normalizedName}`] = formattedValue;

      return [
        [
          {
            json: {
              event: 'dAPIDeviationThreshold',
              dapiName: normalizedName,
              previousValue: lastValue,
              currentValue: formattedValue,
              deviation: deviation.toFixed(2),
              threshold: threshold.toString(),
              timestamp: dapiValue.timestamp,
              timestampISO: formatTimestamp(dapiValue.timestamp),
              network,
            },
          },
        ],
      ];
    }
  } else {
    // Set initial baseline
    pollData[`baseValue_${normalizedName}`] = formattedValue;
  }

  return null;
}

/**
 * Poll for OEV auction started
 */
async function pollOEVAuctionStarted(
  this: IPollFunctions,
  credentials: IDataObject,
  pollData: IDataObject,
): Promise<INodeExecutionData[][] | null> {
  const network = credentials.network as string;

  try {
    // Fetch active auctions from OEV Network API
    const response = (await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.OEV_NETWORK}/auctions/active`,
    )) as {
      auctions?: Array<{
        auctionId: string;
        dapiName: string;
        startTime: number;
        endTime: number;
        minimumBid: string;
      }>;
    };

    const auctions = response.auctions || [];
    const lastKnownAuctions = (pollData.knownAuctions as string[]) || [];
    const newAuctions = auctions.filter((a) => !lastKnownAuctions.includes(a.auctionId));

    if (newAuctions.length > 0) {
      // Update known auctions
      pollData.knownAuctions = auctions.map((a) => a.auctionId);

      return [
        newAuctions.map((auction) => ({
          json: {
            event: 'oevAuctionStarted',
            auctionId: auction.auctionId,
            dapiName: auction.dapiName,
            startTime: auction.startTime,
            endTime: auction.endTime,
            minimumBid: auction.minimumBid,
            startTimeISO: formatTimestamp(auction.startTime),
            endTimeISO: formatTimestamp(auction.endTime),
            network,
          },
        })),
      ];
    }

    // Update known auctions
    pollData.knownAuctions = auctions.map((a) => a.auctionId);
  } catch {
    // API unavailable, skip this poll
  }

  return null;
}

/**
 * Poll for governance proposals
 */
async function pollGovernanceProposal(
  this: IPollFunctions,
  credentials: IDataObject,
  pollData: IDataObject,
): Promise<INodeExecutionData[][] | null> {
  const network = credentials.network as string;

  // Governance only on Ethereum
  if (network !== 'ethereum') {
    return null;
  }

  try {
    // Fetch proposals from API
    const response = (await makeApiRequest(
      this,
      'GET',
      `${API_ENDPOINTS.API3_MARKET}/governance/proposals`,
    )) as {
      proposals?: Array<{
        proposalId: string;
        title: string;
        proposer: string;
        startTime: number;
        endTime: number;
        status: string;
      }>;
    };

    const proposals = response.proposals || [];
    const lastKnownProposals = (pollData.knownProposals as string[]) || [];
    const newProposals = proposals.filter((p) => !lastKnownProposals.includes(p.proposalId));

    if (newProposals.length > 0) {
      // Update known proposals
      pollData.knownProposals = proposals.map((p) => p.proposalId);

      return [
        newProposals.map((proposal) => ({
          json: {
            event: 'governanceProposal',
            proposalId: proposal.proposalId,
            title: proposal.title,
            proposer: proposal.proposer,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            status: proposal.status,
            startTimeISO: formatTimestamp(proposal.startTime),
            endTimeISO: formatTimestamp(proposal.endTime),
            network,
          },
        })),
      ];
    }

    // Update known proposals
    pollData.knownProposals = proposals.map((p) => p.proposalId);
  } catch {
    // API unavailable, skip this poll
  }

  return null;
}

/**
 * Poll for stake rewards available
 */
async function pollStakeRewardAvailable(
  this: IPollFunctions,
  credentials: IDataObject,
  pollData: IDataObject,
): Promise<INodeExecutionData[][] | null> {
  const network = credentials.network as string;
  const rpcEndpoint = credentials.rpcEndpoint as string;
  const userAddress = this.getNodeParameter('userAddress') as string;
  const minReward = this.getNodeParameter('minReward') as number;

  // Staking only on Ethereum
  if (network !== 'ethereum') {
    return null;
  }

  if (!userAddress) {
    return null;
  }

  try {
    const config = getNetworkConfig(network);

    if (!config.stakingPoolAddress) {
      return null;
    }

    // Get user rewards - simplified for HTTP-only implementation
    // In production, would call getUserReward function on staking pool
    const lastReward = (pollData.lastReward as string) || '0';

    // For now, return null since we need actual contract interaction
    // This would be implemented with proper contract calls
    return null;
  } catch {
    // Error checking rewards
    return null;
  }
}
