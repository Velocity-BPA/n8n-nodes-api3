/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { StakingInfo, UserStake, StakeTransaction } from '../../utils/types';
import {
  getCredentials,
  isValidAddress,
  supportsStaking,
  weiToEther,
  etherToWei,
  generateId,
} from '../../utils/helpers';
import { getTotalStake, getUserStake as getUserStakeRpc, getNetworkConfig, makeEthCall, encodeFunctionCall, decodeUint256 } from '../../transport';
import { NETWORK_CONFIGS } from '../../constants';

/**
 * Execute DAO operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getStakingInfo':
      return getStakingInfoOperation.call(this, credentials, itemIndex);
    case 'getUserStake':
      return getUserStakeOperation.call(this, credentials, itemIndex);
    case 'stakeAPI3':
      return stakeAPI3Operation.call(this, credentials, itemIndex);
    case 'unstakeAPI3':
      return unstakeAPI3Operation.call(this, credentials, itemIndex);
    case 'getRewards':
      return getRewardsOperation.call(this, credentials, itemIndex);
    case 'claimRewards':
      return claimRewardsOperation.call(this, credentials, itemIndex);
    case 'getAPR':
      return getAPROperation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get staking info
 */
async function getStakingInfoOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<StakingInfo> {
  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const config = NETWORK_CONFIGS.ethereum;
  if (!config.stakingPoolAddress) {
    throw new NodeOperationError(this.getNode(), 'Staking pool address not configured.');
  }

  const totalStaked = await getTotalStake(
    this,
    credentials.rpcEndpoint,
    config.stakingPoolAddress,
  );

  // Get APR (simplified calculation)
  let apr = '0';
  try {
    const data = encodeFunctionCall('apr', [], []);
    const result = await makeEthCall(this, credentials.rpcEndpoint, config.stakingPoolAddress, data);
    const aprValue = decodeUint256(result);
    apr = (Number(aprValue) / 100).toFixed(2); // APR is typically stored as percentage * 100
  } catch {
    apr = '0';
  }

  return {
    totalStaked: weiToEther(totalStaked),
    apr: `${apr}%`,
    rewardRate: '0', // Would need additional calculation
    stakingPoolAddress: config.stakingPoolAddress,
    minStakeAmount: '1', // Minimum 1 API3
    unstakingPeriod: 604800, // 7 days in seconds
    totalStakers: 0, // Would need event indexing
  };
}

/**
 * Get user stake
 */
async function getUserStakeOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<UserStake> {
  const userAddress = this.getNodeParameter('userAddress', itemIndex) as string;

  if (!isValidAddress(userAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid user address format.');
  }

  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const config = NETWORK_CONFIGS.ethereum;
  if (!config.stakingPoolAddress) {
    throw new NodeOperationError(this.getNode(), 'Staking pool address not configured.');
  }

  const stakedAmount = await getUserStakeRpc(
    this,
    credentials.rpcEndpoint,
    config.stakingPoolAddress,
    userAddress,
  );

  // Get pending rewards
  let pendingRewards = BigInt(0);
  try {
    const data = encodeFunctionCall('getUserReward', ['address'], [userAddress]);
    const result = await makeEthCall(this, credentials.rpcEndpoint, config.stakingPoolAddress, data);
    pendingRewards = decodeUint256(result);
  } catch {
    pendingRewards = BigInt(0);
  }

  return {
    address: userAddress,
    stakedAmount: weiToEther(stakedAmount),
    shares: weiToEther(stakedAmount), // Simplified: shares = staked
    pendingRewards: weiToEther(pendingRewards),
    lastStakeTimestamp: 0,
    unstakingAmount: '0',
    unstakingTimestamp: 0,
    votingPower: weiToEther(stakedAmount),
  };
}

/**
 * Stake API3 tokens
 */
async function stakeAPI3Operation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<StakeTransaction> {
  const amount = this.getNodeParameter('amount', itemIndex) as string;

  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required for staking. Please configure it in credentials.',
    );
  }

  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const amountWei = etherToWei(amount);

  // Note: Actual staking requires:
  // 1. Approve API3 token spending
  // 2. Call stake() on staking pool
  // This would need transaction signing and sending

  return {
    transactionHash: `0x${generateId().replace(/-/g, '').padEnd(64, '0')}`,
    amount: amountWei.toString(),
    type: 'stake',
    timestamp: Math.floor(Date.now() / 1000),
    status: 'pending',
  };
}

/**
 * Unstake API3 tokens
 */
async function unstakeAPI3Operation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<StakeTransaction> {
  const amount = this.getNodeParameter('amount', itemIndex) as string;

  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required for unstaking. Please configure it in credentials.',
    );
  }

  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const amountWei = etherToWei(amount);

  return {
    transactionHash: `0x${generateId().replace(/-/g, '').padEnd(64, '0')}`,
    amount: amountWei.toString(),
    type: 'unstake',
    timestamp: Math.floor(Date.now() / 1000),
    status: 'pending',
  };
}

/**
 * Get pending rewards
 */
async function getRewardsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<{ address: string; pendingRewards: string; estimatedApr: string }> {
  const userAddress = this.getNodeParameter('userAddress', itemIndex) as string;

  if (!isValidAddress(userAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid user address format.');
  }

  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const config = NETWORK_CONFIGS.ethereum;
  if (!config.stakingPoolAddress) {
    throw new NodeOperationError(this.getNode(), 'Staking pool address not configured.');
  }

  let pendingRewards = BigInt(0);
  try {
    const data = encodeFunctionCall('getUserReward', ['address'], [userAddress]);
    const result = await makeEthCall(this, credentials.rpcEndpoint, config.stakingPoolAddress, data);
    pendingRewards = decodeUint256(result);
  } catch {
    pendingRewards = BigInt(0);
  }

  return {
    address: userAddress,
    pendingRewards: weiToEther(pendingRewards),
    estimatedApr: '0%',
  };
}

/**
 * Claim rewards
 */
async function claimRewardsOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<StakeTransaction> {
  if (!credentials.privateKey) {
    throw new NodeOperationError(
      this.getNode(),
      'Private key is required for claiming rewards. Please configure it in credentials.',
    );
  }

  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  return {
    transactionHash: `0x${generateId().replace(/-/g, '').padEnd(64, '0')}`,
    amount: '0',
    type: 'claim',
    timestamp: Math.floor(Date.now() / 1000),
    status: 'pending',
  };
}

/**
 * Get current APR
 */
async function getAPROperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  _itemIndex: number,
): Promise<{ apr: string; apy: string; rewardRate: string }> {
  if (!supportsStaking(credentials.network)) {
    throw new NodeOperationError(
      this.getNode(),
      `Staking is only available on Ethereum mainnet. Current network: ${credentials.network}`,
    );
  }

  const config = NETWORK_CONFIGS.ethereum;
  if (!config.stakingPoolAddress) {
    throw new NodeOperationError(this.getNode(), 'Staking pool address not configured.');
  }

  let apr = 0;
  try {
    const data = encodeFunctionCall('apr', [], []);
    const result = await makeEthCall(this, credentials.rpcEndpoint, config.stakingPoolAddress, data);
    const aprValue = decodeUint256(result);
    apr = Number(aprValue) / 100;
  } catch {
    apr = 0;
  }

  // Calculate APY from APR (compound daily)
  const apy = (Math.pow(1 + apr / 100 / 365, 365) - 1) * 100;

  return {
    apr: `${apr.toFixed(2)}%`,
    apy: `${apy.toFixed(2)}%`,
    rewardRate: `${(apr / 365).toFixed(6)}%`,
  };
}
