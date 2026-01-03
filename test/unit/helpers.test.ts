/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	isValidAddress,
	isValidBytes32,
	weiToEther,
	etherToWei,
	formatWithDecimals,
	parseWithDecimals,
	normalizeDAPIName,
	truncateAddress,
	calculatePercentageChange,
	supportsDAO,
	supportsStaking,
	getExplorerTxUrl,
	getExplorerAddressUrl,
	generateId,
	deepClone,
	chunkArray,
	flattenObject,
} from '../../nodes/Api3/utils/helpers';

describe('Helper Utilities', () => {
	describe('Address Validation', () => {
		it('should validate correct Ethereum address', () => {
			expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00')).toBe(true);
			expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
		});

		it('should reject invalid Ethereum addresses', () => {
			expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f1dE0')).toBe(false); // Too short
			expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f1dE000')).toBe(false); // Too long
			expect(isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f1dE00')).toBe(false); // Missing 0x
			expect(isValidAddress('')).toBe(false);
		});
	});

	describe('Bytes32 Validation', () => {
		it('should validate correct bytes32 values', () => {
			expect(isValidBytes32('0x' + '0'.repeat(64))).toBe(true);
			expect(isValidBytes32('0x' + 'a'.repeat(64))).toBe(true);
			expect(isValidBytes32('0x' + 'F'.repeat(64))).toBe(true);
		});

		it('should reject invalid bytes32 values', () => {
			expect(isValidBytes32('0x' + '0'.repeat(63))).toBe(false); // Too short
			expect(isValidBytes32('0x' + '0'.repeat(65))).toBe(false); // Too long
			expect(isValidBytes32('0'.repeat(64))).toBe(false); // Missing 0x
		});
	});

	describe('Wei/Ether Conversion', () => {
		it('should convert wei to ether correctly', () => {
			expect(weiToEther('1000000000000000000')).toBe('1');
			expect(weiToEther('500000000000000000')).toBe('0.5');
			expect(weiToEther('0')).toBe('0');
		});

		it('should convert ether to wei correctly', () => {
			expect(etherToWei('1')).toBe(BigInt('1000000000000000000'));
			expect(etherToWei('0.5')).toBe(BigInt('500000000000000000'));
			expect(etherToWei('0')).toBe(BigInt('0'));
		});
	});

	describe('Decimal Formatting', () => {
		it('should format with decimals correctly', () => {
			expect(formatWithDecimals('1000000000000000000', 18)).toBe('1');
			expect(formatWithDecimals('1000000', 6)).toBe('1');
			expect(formatWithDecimals('123456789', 8)).toBe('1.23456789');
		});

		it('should parse with decimals correctly', () => {
			expect(parseWithDecimals('1', 18)).toBe(BigInt('1000000000000000000'));
			expect(parseWithDecimals('1', 6)).toBe(BigInt('1000000'));
		});
	});

	describe('dAPI Name Normalization', () => {
		it('should normalize various dAPI name formats', () => {
			expect(normalizeDAPIName('eth-usd')).toBe('ETH/USD');
			expect(normalizeDAPIName('ETH_USD')).toBe('ETH/USD');
			expect(normalizeDAPIName('eth/usd')).toBe('ETH/USD');
			expect(normalizeDAPIName('ETH/USD')).toBe('ETH/USD');
			expect(normalizeDAPIName('BTC-USD')).toBe('BTC/USD');
		});
	});

	describe('Address Truncation', () => {
		it('should truncate addresses correctly', () => {
			const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00';
			expect(truncateAddress(addr)).toBe('0x742d...dE00');
			expect(truncateAddress(addr, 6)).toBe('0x742d35...f1dE00');
		});
	});

	describe('Percentage Change', () => {
		it('should calculate percentage change correctly', () => {
			expect(calculatePercentageChange(BigInt(100), BigInt(110))).toBe('10.00');
			expect(calculatePercentageChange(BigInt(100), BigInt(90))).toBe('-10.00');
			expect(calculatePercentageChange(BigInt(100), BigInt(100))).toBe('0.00');
		});

		it('should handle zero old value', () => {
			expect(calculatePercentageChange(BigInt(0), BigInt(100))).toBe('0');
		});
	});

	describe('Network Feature Support', () => {
		it('should check DAO support correctly', () => {
			expect(supportsDAO('ethereum')).toBe(true);
			expect(supportsDAO('polygon')).toBe(false);
			expect(supportsDAO('arbitrum')).toBe(false);
		});

		it('should check staking support correctly', () => {
			expect(supportsStaking('ethereum')).toBe(true);
			expect(supportsStaking('polygon')).toBe(false);
			expect(supportsStaking('bsc')).toBe(false);
		});
	});

	describe('Explorer URLs', () => {
		it('should generate correct explorer transaction URLs', () => {
			const txHash = '0x123abc';
			expect(getExplorerTxUrl('ethereum', txHash)).toContain('etherscan.io');
			expect(getExplorerTxUrl('ethereum', txHash)).toContain(txHash);
			expect(getExplorerTxUrl('polygon', txHash)).toContain('polygonscan.com');
		});

		it('should generate correct explorer address URLs', () => {
			const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00';
			expect(getExplorerAddressUrl('ethereum', address)).toContain('etherscan.io');
			expect(getExplorerAddressUrl('ethereum', address)).toContain(address);
		});
	});

	describe('Utility Functions', () => {
		it('should generate unique IDs', () => {
			const id1 = generateId();
			const id2 = generateId();
			expect(id1).not.toBe(id2);
			expect(typeof id1).toBe('string');
		});

		it('should deep clone objects', () => {
			const original = { a: 1, b: { c: 2 } };
			const cloned = deepClone(original);
			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned.b).not.toBe(original.b);
		});

		it('should chunk arrays correctly', () => {
			expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
			expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
			expect(chunkArray([], 2)).toEqual([]);
		});

		it('should flatten objects correctly', () => {
			const nested = { a: 1, b: { c: 2, d: { e: 3 } } };
			const flat = flattenObject(nested);
			expect(flat).toEqual({ a: 1, 'b.c': 2, 'b.d.e': 3 });
		});
	});
});
