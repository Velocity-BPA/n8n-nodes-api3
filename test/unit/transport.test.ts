/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  encodeFunctionCall,
  getFunctionSelector,
  encodeParameters,
  decodeInt224,
  decodeUint32,
  decodeUint256,
  formatValue,
  dapiNameToBytes32,
} from '../../nodes/Api3/transport';

describe('Transport Utilities', () => {
  describe('Function Selector', () => {
    it('should generate correct function selectors', () => {
      // Known function selectors
      expect(getFunctionSelector('transfer', ['address', 'uint256'])).toBe('0xa9059cbb');
      expect(getFunctionSelector('balanceOf', ['address'])).toBe('0x70a08231');
      expect(getFunctionSelector('totalSupply', [])).toBe('0x18160ddd');
    });
  });

  describe('Parameter Encoding', () => {
    it('should encode address parameters correctly', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00';
      const encoded = encodeParameters(['address'], [address]);
      expect(encoded).toContain('742d35cc6634c0532925a3b844bc9e7595f1de00');
      expect(encoded.length).toBe(64);
    });

    it('should encode uint256 parameters correctly', () => {
      const encoded = encodeParameters(['uint256'], ['1000000000000000000']);
      expect(encoded.length).toBe(64);
    });

    it('should encode bytes32 parameters correctly', () => {
      const bytes32 = '0x' + 'ab'.repeat(32);
      const encoded = encodeParameters(['bytes32'], [bytes32]);
      expect(encoded.length).toBe(64);
    });
  });

  describe('Value Decoding', () => {
    it('should decode uint256 values correctly', () => {
      const encoded = '0x' + '0de0b6b3a7640000'.padStart(64, '0');
      const decoded = decodeUint256(encoded);
      expect(decoded).toBe(BigInt('1000000000000000000'));
    });

    it('should decode uint32 values correctly', () => {
      const encoded = '0x' + '00000064'.padStart(128, '0');
      const decoded = decodeUint32(encoded, 64);
      expect(decoded).toBe(100);
    });

    it('should decode int224 values correctly', () => {
      // Positive value
      const positiveEncoded = '0x' + '00000001'.padStart(64, '0');
      const positiveDecoded = decodeInt224(positiveEncoded);
      expect(positiveDecoded > 0n).toBe(true);
    });
  });

  describe('Value Formatting', () => {
    it('should format values with correct decimals', () => {
      expect(formatValue(BigInt('1000000000000000000'), 18)).toContain('1');
      expect(formatValue(BigInt('1500000000000000000'), 18)).toContain('1');
      expect(formatValue(BigInt('1000000'), 6)).toContain('1');
    });

    it('should handle zero values', () => {
      expect(formatValue(BigInt('0'), 18)).toBe('0.000000000000000000');
    });

    it('should handle large values', () => {
      const largeValue = BigInt('1000000000000000000000000'); // 1 million tokens
      expect(formatValue(largeValue, 18)).toContain('1000000');
    });
  });

  describe('dAPI Name to Bytes32', () => {
    it('should convert dAPI names to bytes32', () => {
      const bytes32 = dapiNameToBytes32('ETH/USD');
      expect(bytes32.startsWith('0x')).toBe(true);
      expect(bytes32.length).toBe(66); // 0x + 64 hex chars
    });

    it('should produce consistent results', () => {
      const bytes32_1 = dapiNameToBytes32('ETH/USD');
      const bytes32_2 = dapiNameToBytes32('ETH/USD');
      expect(bytes32_1).toBe(bytes32_2);
    });

    it('should produce different results for different names', () => {
      const ethUsd = dapiNameToBytes32('ETH/USD');
      const btcUsd = dapiNameToBytes32('BTC/USD');
      expect(ethUsd).not.toBe(btcUsd);
    });
  });

  describe('Function Call Encoding', () => {
    it('should encode function calls correctly', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00';
      const encoded = encodeFunctionCall('balanceOf', ['address'], [address]);

      // Should start with function selector
      expect(encoded.startsWith('0x70a08231')).toBe(true);
      // Should contain the address
      expect(encoded.toLowerCase()).toContain('742d35cc6634c0532925a3b844bc9e7595f1de00');
    });

    it('should encode transfer calls correctly', () => {
      const to = '0x742d35Cc6634C0532925a3b844Bc9e7595f1dE00';
      const amount = '1000000000000000000';
      const encoded = encodeFunctionCall('transfer', ['address', 'uint256'], [to, amount]);

      expect(encoded.startsWith('0xa9059cbb')).toBe(true);
    });
  });
});
