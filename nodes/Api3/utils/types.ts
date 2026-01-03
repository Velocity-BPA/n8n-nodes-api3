/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl?: string;
  explorerUrl: string;
  dapiServerAddress: string;
  api3TokenAddress?: string;
  stakingPoolAddress?: string;
  governanceAddress?: string;
}

/**
 * dAPI (Decentralized API) types
 */
export interface DAPIValue {
  value: string;
  timestamp: number;
  dapiName: string;
  network: string;
  formattedValue: string;
  decimals: number;
}

export interface DAPIInfo {
  name: string;
  category: string;
  description: string;
  decimals: number;
  deviation: string;
  heartbeat: number;
  sources: string[];
  sponsorWallet: string;
  network: string;
  contractAddress: string;
  lastUpdated: number;
}

export interface DAPIListItem {
  name: string;
  category: string;
  network: string;
  active: boolean;
  price?: string;
}

export interface DAPIUpdateInfo {
  lastUpdateTimestamp: number;
  nextExpectedUpdate: number;
  heartbeatSeconds: number;
  lastUpdateBlock: number;
}

export interface DAPIDeviation {
  deviationThresholdPercent: string;
  currentDeviation: string;
  lastUpdateReason: 'deviation' | 'heartbeat' | 'manual';
}

export interface DAPISource {
  airnodeName: string;
  airnodeAddress: string;
  endpointId: string;
  templateId: string;
  lastValue: string;
  lastTimestamp: number;
}

/**
 * Data Feed types
 */
export interface DataFeedValue {
  feedId: string;
  value: string;
  timestamp: number;
  formattedValue: string;
  decimals: number;
}

export interface DataFeedHistory {
  feedId: string;
  values: Array<{
    value: string;
    timestamp: number;
    blockNumber: number;
  }>;
  startTimestamp: number;
  endTimestamp: number;
}

export interface DataFeedMetadata {
  feedId: string;
  name: string;
  description: string;
  category: string;
  decimals: number;
  createdAt: number;
  sponsor: string;
}

export interface BeaconData {
  beaconId: string;
  airnodeAddress: string;
  templateId: string;
  value: string;
  timestamp: number;
}

/**
 * Airnode types
 */
export interface AirnodeInfo {
  airnodeAddress: string;
  name: string;
  description: string;
  homeUrl: string;
  logoUrl: string;
  xpub: string;
  endpoints: number;
  chains: string[];
  stage: string;
}

export interface AirnodeEndpoint {
  endpointId: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  oisTitle: string;
}

export interface AirnodeRequest {
  requestId: string;
  airnodeAddress: string;
  endpointId: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'fulfilled' | 'failed';
  response?: unknown;
  timestamp: number;
}

/**
 * OEV (Oracle Extractable Value) types
 */
export interface OEVNetworkInfo {
  networkName: string;
  chainId: number;
  oevAuctionHouseAddress: string;
  activeAuctions: number;
  totalBidsAllTime: string;
  totalValueCaptured: string;
}

export interface OEVAuction {
  auctionId: string;
  dapiName: string;
  startTime: number;
  endTime: number;
  minimumBid: string;
  currentHighestBid: string;
  bidCount: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface OEVBid {
  bidId: string;
  auctionId: string;
  bidder: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
}

export interface OEVStats {
  totalAuctions: number;
  totalBids: number;
  totalValueCaptured: string;
  averageBidAmount: string;
  uniqueBidders: number;
  successRate: string;
}

/**
 * DAO types
 */
export interface StakingInfo {
  totalStaked: string;
  apr: string;
  rewardRate: string;
  stakingPoolAddress: string;
  minStakeAmount: string;
  unstakingPeriod: number;
  totalStakers: number;
}

export interface UserStake {
  address: string;
  stakedAmount: string;
  shares: string;
  pendingRewards: string;
  lastStakeTimestamp: number;
  unstakingAmount: string;
  unstakingTimestamp: number;
  votingPower: string;
}

export interface StakeTransaction {
  transactionHash: string;
  amount: string;
  type: 'stake' | 'unstake' | 'claim';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

/**
 * Governance types
 */
export interface Proposal {
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
  executionTimestamp?: number;
}

export interface VoteRecord {
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: number;
  transactionHash: string;
}

export interface Treasury {
  balance: string;
  api3Balance: string;
  ethBalance: string;
  totalAllocated: string;
  totalSpent: string;
  recentTransactions: Array<{
    hash: string;
    amount: string;
    type: string;
    timestamp: number;
  }>;
}

/**
 * API3 Token types
 */
export interface TokenPrice {
  usd: number;
  eth: number;
  change24h: number;
  volume24h: string;
  marketCap: string;
  lastUpdated: number;
}

export interface TokenSupply {
  totalSupply: string;
  circulatingSupply: string;
  stakedSupply: string;
  burnedSupply: string;
  lockedSupply: string;
}

export interface TokenBalance {
  address: string;
  balance: string;
  formattedBalance: string;
  stakedBalance: string;
  totalBalance: string;
}

export interface TokenTransfer {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
}

/**
 * Insurance/Coverage types
 */
export interface CoverageInfo {
  policyId: string;
  holder: string;
  dapiNames: string[];
  coverageAmount: string;
  premium: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'expired' | 'claimed';
}

export interface AvailableCoverage {
  dapiName: string;
  maxCoverage: string;
  premiumRate: string;
  availableCapacity: string;
  terms: number[];
}

export interface Claim {
  claimId: string;
  policyId: string;
  claimant: string;
  amount: string;
  reason: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  evidence: string[];
}

/**
 * Subscription types
 */
export interface Subscription {
  subscriptionId: string;
  dapiName: string;
  subscriber: string;
  startTime: number;
  endTime: number;
  tier: 'basic' | 'pro' | 'enterprise';
  updateFrequency: number;
  status: 'active' | 'expired' | 'cancelled';
}

export interface SubscriptionCreate {
  transactionHash: string;
  subscriptionId: string;
  dapiName: string;
  duration: number;
  cost: string;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Utility types
 */
export interface SupportedChain {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  explorerUrl: string;
  testnet: boolean;
}

export interface ContractAddresses {
  network: string;
  chainId: number;
  dapiServer: string;
  api3Token?: string;
  stakingPool?: string;
  governance?: string;
  oevAuctionHouse?: string;
  coverage?: string;
}

export interface EncodedParameters {
  encodedParameters: string;
  parametersHash: string;
  decodedPreview: Record<string, unknown>;
}

export interface APIHealth {
  status: 'healthy' | 'degraded' | 'down';
  rpcLatency: number;
  lastBlockTime: number;
  syncStatus: 'synced' | 'syncing' | 'behind';
  services: {
    dapiServer: boolean;
    oevNetwork: boolean;
    governance: boolean;
  };
}

/**
 * Trigger event types
 */
export interface DAPIPriceUpdateEvent {
  dapiName: string;
  oldValue: string;
  newValue: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface DeviationThresholdEvent {
  dapiName: string;
  deviation: string;
  thresholdPercent: string;
  currentPrice: string;
  previousPrice: string;
  timestamp: number;
}

export interface OEVAuctionEvent {
  auctionId: string;
  dapiName: string;
  startTime: number;
  endTime: number;
  minimumBid: string;
}

export interface GovernanceProposalEvent {
  proposalId: string;
  title: string;
  proposer: string;
  startTime: number;
  endTime: number;
}

export interface StakeRewardEvent {
  address: string;
  pendingRewards: string;
  estimatedApr: string;
  lastClaimTimestamp: number;
}

/**
 * Error types
 */
export interface Api3Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * RPC response types
 */
export interface RpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Transaction types
 */
export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  status: number;
  gasUsed: string;
  effectiveGasPrice: string;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
}
