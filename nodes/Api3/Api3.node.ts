/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { logLicensingNotice, buildReturnData } from './utils/helpers';
import { COMMON_DAPIS, NETWORK_CONFIGS } from './constants';

// Import action handlers
import * as dapis from './actions/dapis';
import * as dataFeeds from './actions/dataFeeds';
import * as airnodes from './actions/airnodes';
import * as oev from './actions/oev';
import * as dao from './actions/dao';
import * as governance from './actions/governance';
import * as token from './actions/token';
import * as insurance from './actions/insurance';
import * as subscriptions from './actions/subscriptions';
import * as utility from './actions/utility';

export class Api3 implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'API3',
    name: 'api3',
    icon: 'file:api3.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Interact with API3 decentralized oracle protocol - dAPIs, Airnodes, OEV, DAO governance, and staking',
    defaults: {
      name: 'API3',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'api3Credentials',
        required: true,
      },
    ],
    properties: [
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'dAPI',
            value: 'dapis',
            description: 'Decentralized API price feeds',
          },
          {
            name: 'Data Feed',
            value: 'dataFeeds',
            description: 'Individual data feed operations',
          },
          {
            name: 'Airnode',
            value: 'airnodes',
            description: 'First-party oracle nodes',
          },
          {
            name: 'OEV',
            value: 'oev',
            description: 'Oracle Extractable Value auctions',
          },
          {
            name: 'DAO',
            value: 'dao',
            description: 'API3 DAO staking operations',
          },
          {
            name: 'Governance',
            value: 'governance',
            description: 'DAO governance and voting',
          },
          {
            name: 'Token',
            value: 'token',
            description: 'API3 token operations',
          },
          {
            name: 'Insurance',
            value: 'insurance',
            description: 'Coverage and claims',
          },
          {
            name: 'Subscription',
            value: 'subscriptions',
            description: 'dAPI subscriptions',
          },
          {
            name: 'Utility',
            value: 'utility',
            description: 'Helper functions and utilities',
          },
        ],
        default: 'dapis',
      },

      // ============= dAPIs Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['dapis'],
          },
        },
        options: [
          {
            name: 'Get dAPI Value',
            value: 'getDAPIValue',
            description: 'Read current price feed value',
            action: 'Get d api value',
          },
          {
            name: 'Get dAPI Info',
            value: 'getDAPIInfo',
            description: 'Get feed details (sources, deviation)',
            action: 'Get d api info',
          },
          {
            name: 'List dAPIs',
            value: 'listDAPIs',
            description: 'Get available feeds for network',
            action: 'List d ap is',
          },
          {
            name: 'Get Update Time',
            value: 'getDAPIUpdateTime',
            description: 'Get last update timestamp',
            action: 'Get update time',
          },
          {
            name: 'Get Deviation',
            value: 'getDAPIDeviation',
            description: 'Get update threshold',
            action: 'Get deviation',
          },
          {
            name: 'Get Sources',
            value: 'getDAPISources',
            description: 'Get data provider list',
            action: 'Get sources',
          },
        ],
        default: 'getDAPIValue',
      },

      // ============= Data Feeds Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['dataFeeds'],
          },
        },
        options: [
          {
            name: 'Read Data Feed',
            value: 'readDataFeed',
            description: 'Get current value by feed ID',
            action: 'Read data feed',
          },
          {
            name: 'Get Feed History',
            value: 'getFeedHistory',
            description: 'Get historical values',
            action: 'Get feed history',
          },
          {
            name: 'Get Feed Metadata',
            value: 'getFeedMetadata',
            description: 'Get feed information',
            action: 'Get feed metadata',
          },
          {
            name: 'Get Multiple Feeds',
            value: 'getMultipleFeeds',
            description: 'Batch read feeds',
            action: 'Get multiple feeds',
          },
          {
            name: 'Get Feed Beacon',
            value: 'getFeedBeacon',
            description: 'Get individual source data',
            action: 'Get feed beacon',
          },
        ],
        default: 'readDataFeed',
      },

      // ============= Airnodes Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['airnodes'],
          },
        },
        options: [
          {
            name: 'Get Airnode Info',
            value: 'getAirnodeInfo',
            description: 'Get node details',
            action: 'Get airnode info',
          },
          {
            name: 'List Airnodes',
            value: 'listAirnodes',
            description: 'Get available Airnodes',
            action: 'List airnodes',
          },
          {
            name: 'Get Endpoints',
            value: 'getAirnodeEndpoints',
            description: 'Get API endpoints',
            action: 'Get endpoints',
          },
          {
            name: 'Make Request',
            value: 'makeAirnodeRequest',
            description: 'Call API through Airnode',
            action: 'Make request',
          },
          {
            name: 'Get Request Status',
            value: 'getRequestStatus',
            description: 'Check response status',
            action: 'Get request status',
          },
        ],
        default: 'getAirnodeInfo',
      },

      // ============= OEV Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['oev'],
          },
        },
        options: [
          {
            name: 'Get Network Info',
            value: 'getOEVNetworkInfo',
            description: 'Get OEV network status',
            action: 'Get network info',
          },
          {
            name: 'Get Auction Info',
            value: 'getAuctionInfo',
            description: 'Get current auction details',
            action: 'Get auction info',
          },
          {
            name: 'Place Bid',
            value: 'placeOEVBid',
            description: 'Submit bid to auction',
            action: 'Place bid',
          },
          {
            name: 'Get Bid Status',
            value: 'getBidStatus',
            description: 'Check bid result',
            action: 'Get bid status',
          },
          {
            name: 'Get Stats',
            value: 'getOEVStats',
            description: 'Get protocol statistics',
            action: 'Get stats',
          },
        ],
        default: 'getOEVNetworkInfo',
      },

      // ============= DAO Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['dao'],
          },
        },
        options: [
          {
            name: 'Get Staking Info',
            value: 'getStakingInfo',
            description: 'Get staking pool details',
            action: 'Get staking info',
          },
          {
            name: 'Get User Stake',
            value: 'getUserStake',
            description: "Get user's staked amount",
            action: 'Get user stake',
          },
          {
            name: 'Stake API3',
            value: 'stakeAPI3',
            description: 'Deposit tokens to staking pool',
            action: 'Stake api3',
          },
          {
            name: 'Unstake API3',
            value: 'unstakeAPI3',
            description: 'Request withdrawal',
            action: 'Unstake api3',
          },
          {
            name: 'Get Rewards',
            value: 'getRewards',
            description: 'Get pending rewards',
            action: 'Get rewards',
          },
          {
            name: 'Claim Rewards',
            value: 'claimRewards',
            description: 'Withdraw rewards',
            action: 'Claim rewards',
          },
          {
            name: 'Get APR',
            value: 'getAPR',
            description: 'Get current staking yield',
            action: 'Get apr',
          },
        ],
        default: 'getStakingInfo',
      },

      // ============= Governance Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['governance'],
          },
        },
        options: [
          {
            name: 'Get Proposals',
            value: 'getProposals',
            description: 'Get DAO proposals',
            action: 'Get proposals',
          },
          {
            name: 'Get Proposal',
            value: 'getProposal',
            description: 'Get single proposal',
            action: 'Get proposal',
          },
          {
            name: 'Vote on Proposal',
            value: 'voteOnProposal',
            description: 'Cast vote',
            action: 'Vote on proposal',
          },
          {
            name: 'Get Vote Record',
            value: 'getVoteRecord',
            description: 'Get voting history',
            action: 'Get vote record',
          },
          {
            name: 'Get Treasury',
            value: 'getTreasury',
            description: 'Get DAO treasury',
            action: 'Get treasury',
          },
        ],
        default: 'getProposals',
      },

      // ============= Token Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['token'],
          },
        },
        options: [
          {
            name: 'Get Price',
            value: 'getAPI3Price',
            description: 'Get current API3 price',
            action: 'Get price',
          },
          {
            name: 'Get Supply',
            value: 'getAPI3Supply',
            description: 'Get token supply info',
            action: 'Get supply',
          },
          {
            name: 'Get Balance',
            value: 'getUserBalance',
            description: 'Get token balance',
            action: 'Get balance',
          },
          {
            name: 'Transfer',
            value: 'transferAPI3',
            description: 'Send tokens',
            action: 'Transfer',
          },
        ],
        default: 'getAPI3Price',
      },

      // ============= Insurance Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['insurance'],
          },
        },
        options: [
          {
            name: 'Get Coverage Info',
            value: 'getCoverageInfo',
            description: 'Get policy details',
            action: 'Get coverage info',
          },
          {
            name: 'Get Available Coverage',
            value: 'getAvailableCoverage',
            description: 'Get available policies',
            action: 'Get available coverage',
          },
          {
            name: 'Get Claims',
            value: 'getClaims',
            description: 'Get claim history',
            action: 'Get claims',
          },
          {
            name: 'Check Coverage',
            value: 'checkCoverage',
            description: 'Verify active policy',
            action: 'Check coverage',
          },
        ],
        default: 'getCoverageInfo',
      },

      // ============= Subscriptions Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['subscriptions'],
          },
        },
        options: [
          {
            name: 'Get Subscription',
            value: 'getSubscription',
            description: 'Get dAPI subscription',
            action: 'Get subscription',
          },
          {
            name: 'List Subscriptions',
            value: 'listSubscriptions',
            description: 'Get active subscriptions',
            action: 'List subscriptions',
          },
          {
            name: 'Create Subscription',
            value: 'createSubscription',
            description: 'Subscribe to dAPI',
            action: 'Create subscription',
          },
          {
            name: 'Renew Subscription',
            value: 'renewSubscription',
            description: 'Extend subscription',
            action: 'Renew subscription',
          },
        ],
        default: 'getSubscription',
      },

      // ============= Utility Operations =============
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['utility'],
          },
        },
        options: [
          {
            name: 'Get Supported Chains',
            value: 'getSupportedChains',
            description: 'Get available networks',
            action: 'Get supported chains',
          },
          {
            name: 'Get Contract Addresses',
            value: 'getContractAddresses',
            description: 'Get deployed contracts',
            action: 'Get contract addresses',
          },
          {
            name: 'Encode Parameters',
            value: 'encodeParameters',
            description: 'Encode Airnode parameters',
            action: 'Encode parameters',
          },
          {
            name: 'Get API Health',
            value: 'getAPIHealth',
            description: 'Check service status',
            action: 'Get api health',
          },
        ],
        default: 'getSupportedChains',
      },

      // ============= Parameters for dAPIs =============
      {
        displayName: 'dAPI Name',
        name: 'dapiName',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getDAPIOptions',
        },
        default: '',
        description: 'The dAPI price feed name (e.g., ETH/USD)',
        displayOptions: {
          show: {
            resource: ['dapis'],
            operation: [
              'getDAPIValue',
              'getDAPIInfo',
              'getDAPIUpdateTime',
              'getDAPIDeviation',
              'getDAPISources',
            ],
          },
        },
        required: true,
      },

      // ============= Parameters for Data Feeds =============
      {
        displayName: 'Feed ID',
        name: 'feedId',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The data feed ID (bytes32)',
        displayOptions: {
          show: {
            resource: ['dataFeeds'],
            operation: ['readDataFeed', 'getFeedHistory', 'getFeedMetadata', 'getFeedBeacon'],
          },
        },
        required: true,
      },
      {
        displayName: 'Feed IDs',
        name: 'feedIds',
        type: 'string',
        default: '',
        placeholder: '0x..., 0x...',
        description: 'Comma-separated list of feed IDs',
        displayOptions: {
          show: {
            resource: ['dataFeeds'],
            operation: ['getMultipleFeeds'],
          },
        },
        required: true,
      },
      {
        displayName: 'Start Timestamp',
        name: 'startTimestamp',
        type: 'number',
        default: 0,
        description: 'Start timestamp for history query',
        displayOptions: {
          show: {
            resource: ['dataFeeds'],
            operation: ['getFeedHistory'],
          },
        },
      },
      {
        displayName: 'End Timestamp',
        name: 'endTimestamp',
        type: 'number',
        default: 0,
        description: 'End timestamp for history query (0 = now)',
        displayOptions: {
          show: {
            resource: ['dataFeeds'],
            operation: ['getFeedHistory'],
          },
        },
      },

      // ============= Parameters for Airnodes =============
      {
        displayName: 'Airnode Address',
        name: 'airnodeAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The Airnode address',
        displayOptions: {
          show: {
            resource: ['airnodes'],
            operation: ['getAirnodeInfo', 'getAirnodeEndpoints', 'makeAirnodeRequest'],
          },
        },
        required: true,
      },
      {
        displayName: 'Endpoint ID',
        name: 'endpointId',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The endpoint ID',
        displayOptions: {
          show: {
            resource: ['airnodes'],
            operation: ['makeAirnodeRequest'],
          },
        },
        required: true,
      },
      {
        displayName: 'Parameters',
        name: 'parameters',
        type: 'json',
        default: '{}',
        description: 'Request parameters as JSON',
        displayOptions: {
          show: {
            resource: ['airnodes'],
            operation: ['makeAirnodeRequest'],
          },
        },
      },
      {
        displayName: 'Request ID',
        name: 'requestId',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The request ID to check',
        displayOptions: {
          show: {
            resource: ['airnodes'],
            operation: ['getRequestStatus'],
          },
        },
        required: true,
      },

      // ============= Parameters for OEV =============
      {
        displayName: 'Auction ID',
        name: 'auctionId',
        type: 'string',
        default: '',
        description: 'The auction ID',
        displayOptions: {
          show: {
            resource: ['oev'],
            operation: ['getAuctionInfo', 'placeOEVBid'],
          },
        },
        required: true,
      },
      {
        displayName: 'Bid Amount',
        name: 'bidAmount',
        type: 'string',
        default: '',
        placeholder: '0.1',
        description: 'Bid amount in ETH',
        displayOptions: {
          show: {
            resource: ['oev'],
            operation: ['placeOEVBid'],
          },
        },
        required: true,
      },
      {
        displayName: 'Bid ID',
        name: 'bidId',
        type: 'string',
        default: '',
        description: 'The bid ID to check',
        displayOptions: {
          show: {
            resource: ['oev'],
            operation: ['getBidStatus'],
          },
        },
        required: true,
      },

      // ============= Parameters for DAO =============
      {
        displayName: 'User Address',
        name: 'userAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The user address to query',
        displayOptions: {
          show: {
            resource: ['dao'],
            operation: ['getUserStake', 'getRewards'],
          },
        },
        required: true,
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'string',
        default: '',
        placeholder: '100',
        description: 'Amount of API3 tokens',
        displayOptions: {
          show: {
            resource: ['dao'],
            operation: ['stakeAPI3', 'unstakeAPI3'],
          },
        },
        required: true,
      },

      // ============= Parameters for Governance =============
      {
        displayName: 'Proposal ID',
        name: 'proposalId',
        type: 'string',
        default: '',
        description: 'The proposal ID',
        displayOptions: {
          show: {
            resource: ['governance'],
            operation: ['getProposal', 'voteOnProposal', 'getVoteRecord'],
          },
        },
        required: true,
      },
      {
        displayName: 'Status Filter',
        name: 'statusFilter',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Active', value: 'active' },
          { name: 'Pending', value: 'pending' },
          { name: 'Succeeded', value: 'succeeded' },
          { name: 'Defeated', value: 'defeated' },
          { name: 'Executed', value: 'executed' },
        ],
        default: 'all',
        description: 'Filter proposals by status',
        displayOptions: {
          show: {
            resource: ['governance'],
            operation: ['getProposals'],
          },
        },
      },
      {
        displayName: 'Vote',
        name: 'vote',
        type: 'options',
        options: [
          { name: 'For', value: 'for' },
          { name: 'Against', value: 'against' },
          { name: 'Abstain', value: 'abstain' },
        ],
        default: 'for',
        description: 'Your vote on the proposal',
        displayOptions: {
          show: {
            resource: ['governance'],
            operation: ['voteOnProposal'],
          },
        },
        required: true,
      },
      {
        displayName: 'Voter Address',
        name: 'voterAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The voter address to query',
        displayOptions: {
          show: {
            resource: ['governance'],
            operation: ['getVoteRecord'],
          },
        },
        required: true,
      },

      // ============= Parameters for Token =============
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The address to query balance',
        displayOptions: {
          show: {
            resource: ['token'],
            operation: ['getUserBalance'],
          },
        },
        required: true,
      },
      {
        displayName: 'To Address',
        name: 'toAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Recipient address',
        displayOptions: {
          show: {
            resource: ['token'],
            operation: ['transferAPI3'],
          },
        },
        required: true,
      },
      {
        displayName: 'Transfer Amount',
        name: 'transferAmount',
        type: 'string',
        default: '',
        placeholder: '100',
        description: 'Amount of API3 to transfer',
        displayOptions: {
          show: {
            resource: ['token'],
            operation: ['transferAPI3'],
          },
        },
        required: true,
      },

      // ============= Parameters for Insurance =============
      {
        displayName: 'Policy ID',
        name: 'policyId',
        type: 'string',
        default: '',
        description: 'The policy ID',
        displayOptions: {
          show: {
            resource: ['insurance'],
            operation: ['getCoverageInfo', 'getClaims', 'checkCoverage'],
          },
        },
        required: true,
      },
      {
        displayName: 'dAPI Name for Coverage',
        name: 'dapiNameCoverage',
        type: 'string',
        default: '',
        placeholder: 'ETH/USD',
        description: 'The dAPI name to check coverage for',
        displayOptions: {
          show: {
            resource: ['insurance'],
            operation: ['getAvailableCoverage'],
          },
        },
      },

      // ============= Parameters for Subscriptions =============
      {
        displayName: 'Subscription ID',
        name: 'subscriptionId',
        type: 'string',
        default: '',
        description: 'The subscription ID',
        displayOptions: {
          show: {
            resource: ['subscriptions'],
            operation: ['getSubscription', 'renewSubscription'],
          },
        },
        required: true,
      },
      {
        displayName: 'Subscriber Address',
        name: 'subscriberAddress',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'The subscriber address',
        displayOptions: {
          show: {
            resource: ['subscriptions'],
            operation: ['listSubscriptions'],
          },
        },
        required: true,
      },
      {
        displayName: 'dAPI to Subscribe',
        name: 'dapiToSubscribe',
        type: 'string',
        default: '',
        placeholder: 'ETH/USD',
        description: 'The dAPI to subscribe to',
        displayOptions: {
          show: {
            resource: ['subscriptions'],
            operation: ['createSubscription'],
          },
        },
        required: true,
      },
      {
        displayName: 'Duration (Days)',
        name: 'durationDays',
        type: 'number',
        default: 30,
        description: 'Subscription duration in days',
        displayOptions: {
          show: {
            resource: ['subscriptions'],
            operation: ['createSubscription', 'renewSubscription'],
          },
        },
        required: true,
      },

      // ============= Parameters for Utility =============
      {
        displayName: 'Network for Addresses',
        name: 'networkForAddresses',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getNetworkOptions',
        },
        default: 'ethereum',
        description: 'Network to get contract addresses for',
        displayOptions: {
          show: {
            resource: ['utility'],
            operation: ['getContractAddresses'],
          },
        },
      },
      {
        displayName: 'Parameters to Encode',
        name: 'parametersToEncode',
        type: 'json',
        default: '{}',
        description: 'Parameters to encode as JSON',
        displayOptions: {
          show: {
            resource: ['utility'],
            operation: ['encodeParameters'],
          },
        },
        required: true,
      },
    ],
  };

  methods = {
    loadOptions: {
      async getDAPIOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        return COMMON_DAPIS.map((name) => ({
          name,
          value: name,
        }));
      },

      async getNetworkOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        return Object.entries(NETWORK_CONFIGS).map(([key, config]) => ({
          name: config.name,
          value: key,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Log licensing notice once
    logLicensingNotice(this);

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: unknown;

        switch (resource) {
          case 'dapis':
            result = await dapis.execute.call(this, operation, i);
            break;
          case 'dataFeeds':
            result = await dataFeeds.execute.call(this, operation, i);
            break;
          case 'airnodes':
            result = await airnodes.execute.call(this, operation, i);
            break;
          case 'oev':
            result = await oev.execute.call(this, operation, i);
            break;
          case 'dao':
            result = await dao.execute.call(this, operation, i);
            break;
          case 'governance':
            result = await governance.execute.call(this, operation, i);
            break;
          case 'token':
            result = await token.execute.call(this, operation, i);
            break;
          case 'insurance':
            result = await insurance.execute.call(this, operation, i);
            break;
          case 'subscriptions':
            result = await subscriptions.execute.call(this, operation, i);
            break;
          case 'utility':
            result = await utility.execute.call(this, operation, i);
            break;
          default:
            throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        const executionData = buildReturnData(result);
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
