/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { TokenPrice, TokenSupply, TokenBalance, TokenTransfer } from '../../utils/types';
import { getCredentials, formatWithDecimals, isValidAddress } from '../../utils/helpers';
import {
  makeEthCall,
  getNetworkConfig,
  encodeFunctionCall,
  decodeUint256,
  getAPI3Price,
  getTokenBalance,
  getTotalSupply,
} from '../../transport';

/**
 * Execute token operations
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<unknown> {
  const credentials = await getCredentials(this);

  switch (operation) {
    case 'getAPI3Price':
      return getAPI3PriceOperation.call(this, credentials, itemIndex);
    case 'getAPI3Supply':
      return getAPI3SupplyOperation.call(this, credentials, itemIndex);
    case 'getUserBalance':
      return getUserBalanceOperation.call(this, credentials, itemIndex);
    case 'transferAPI3':
      return transferAPI3Operation.call(this, credentials, itemIndex);
    default:
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
  }
}

/**
 * Get current API3 token price
 */
async function getAPI3PriceOperation(
  this: IExecuteFunctions,
  _credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<TokenPrice> {
  try {
    const priceData = await getAPI3Price(this);

    return {
      usd: priceData.usd,
      eth: priceData.eth,
      change24h: priceData.change24h,
      volume24h: '0', // CoinGecko simple API doesn't include volume
      marketCap: '0', // CoinGecko simple API doesn't include market cap
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get API3 price: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get API3 token supply information
 */
async function getAPI3SupplyOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<TokenSupply> {
  try {
    const config = getNetworkConfig(credentials.network);

    if (!config.api3TokenAddress) {
      throw new Error(`API3 token not available on ${credentials.network}`);
    }

    // Get total supply
    const totalSupplyRaw = await getTotalSupply(
      this,
      credentials.rpcEndpoint,
      config.api3TokenAddress,
    );
    const totalSupply = formatWithDecimals(totalSupplyRaw, 18);

    // Get staked supply if staking pool exists
    let stakedSupply = '0';
    if (config.stakingPoolAddress) {
      try {
        const stakedRaw = await getTokenBalance(
          this,
          credentials.rpcEndpoint,
          config.api3TokenAddress,
          config.stakingPoolAddress,
        );
        stakedSupply = formatWithDecimals(stakedRaw, 18);
      } catch {
        // Staking pool balance unavailable
      }
    }

    // Calculate circulating supply (total - staked - burned - locked)
    // For simplicity, just showing total and staked
    const circulatingRaw =
      totalSupplyRaw - BigInt(stakedSupply.replace('.', '').padEnd(18, '0') || '0');
    const circulatingSupply = formatWithDecimals(circulatingRaw > 0n ? circulatingRaw : 0n, 18);

    return {
      totalSupply,
      circulatingSupply,
      stakedSupply,
      burnedSupply: '0',
      lockedSupply: '0',
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get API3 supply: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Get user's API3 token balance
 */
async function getUserBalanceOperation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<TokenBalance> {
  const userAddress = this.getNodeParameter('userAddress', itemIndex) as string;

  if (!isValidAddress(userAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid Ethereum address', { itemIndex });
  }

  try {
    const config = getNetworkConfig(credentials.network);

    if (!config.api3TokenAddress) {
      throw new Error(`API3 token not available on ${credentials.network}`);
    }

    // Get token balance
    const balanceRaw = await getTokenBalance(
      this,
      credentials.rpcEndpoint,
      config.api3TokenAddress,
      userAddress,
    );
    const balance = formatWithDecimals(balanceRaw, 18);

    // Get staked balance if staking pool exists
    let stakedBalance = '0';
    if (config.stakingPoolAddress) {
      try {
        const data = encodeFunctionCall('userStake', ['address'], [userAddress]);
        const result = await makeEthCall(
          this,
          credentials.rpcEndpoint,
          config.stakingPoolAddress,
          data,
        );
        const stakedRaw = decodeUint256(result);
        stakedBalance = formatWithDecimals(stakedRaw, 18);
      } catch {
        // Staking balance unavailable
      }
    }

    // Calculate total balance
    const totalRaw = balanceRaw + BigInt(stakedBalance.replace('.', '').padEnd(18, '0') || '0');
    const totalBalance = formatWithDecimals(totalRaw, 18);

    return {
      address: userAddress,
      balance,
      formattedBalance: `${balance} API3`,
      stakedBalance,
      totalBalance,
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to get user balance: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}

/**
 * Transfer API3 tokens
 */
async function transferAPI3Operation(
  this: IExecuteFunctions,
  credentials: Awaited<ReturnType<typeof getCredentials>>,
  itemIndex: number,
): Promise<TokenTransfer> {
  if (!credentials.privateKey) {
    throw new NodeOperationError(this.getNode(), 'Private key is required for transfers', {
      itemIndex,
    });
  }

  const toAddress = this.getNodeParameter('toAddress', itemIndex) as string;
  const amount = this.getNodeParameter('amount', itemIndex) as string;

  if (!isValidAddress(toAddress)) {
    throw new NodeOperationError(this.getNode(), 'Invalid recipient address', { itemIndex });
  }

  try {
    const config = getNetworkConfig(credentials.network);

    if (!config.api3TokenAddress) {
      throw new Error(`API3 token not available on ${credentials.network}`);
    }

    // Parse amount to wei (18 decimals)
    const parts = amount.split('.');
    const integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '0';
    fractionalPart = fractionalPart.padEnd(18, '0').slice(0, 18);
    const amountWei = BigInt(integerPart + fractionalPart);

    // Build transfer transaction data
    // Function: transfer(address to, uint256 amount)
    const data = encodeFunctionCall('transfer', ['address', 'uint256'], [toAddress, amountWei]);

    return {
      transactionHash: '', // Will be set after signing
      from: '', // Will be derived from private key
      to: toAddress,
      amount,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending',
    };
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to prepare transfer: ${(error as Error).message}`,
      { itemIndex },
    );
  }
}
