/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	NETWORK_CONFIGS,
	SUPPORTED_CHAINS,
	COMMON_DAPIS,
	API_ENDPOINTS,
	POLL_INTERVALS,
	CACHE_TTL,
	DEFAULT_DECIMALS,
	LICENSING_NOTICE,
} from '../../nodes/Api3/constants';

describe('Constants', () => {
	describe('Network Configurations', () => {
		it('should have Ethereum mainnet configuration', () => {
			expect(NETWORK_CONFIGS.ethereum).toBeDefined();
			expect(NETWORK_CONFIGS.ethereum.chainId).toBe(1);
			expect(NETWORK_CONFIGS.ethereum.dapiServerAddress).toBeDefined();
		});

		it('should have Polygon configuration', () => {
			expect(NETWORK_CONFIGS.polygon).toBeDefined();
			expect(NETWORK_CONFIGS.polygon.chainId).toBe(137);
		});

		it('should have Arbitrum configuration', () => {
			expect(NETWORK_CONFIGS.arbitrum).toBeDefined();
			expect(NETWORK_CONFIGS.arbitrum.chainId).toBe(42161);
		});

		it('should have valid dAPI server addresses', () => {
			Object.entries(NETWORK_CONFIGS).forEach(([network, config]) => {
				expect(config.dapiServerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
			});
		});

		it('should have explorer URLs for all networks', () => {
			Object.entries(NETWORK_CONFIGS).forEach(([network, config]) => {
				expect(config.explorerUrl).toBeDefined();
				expect(config.explorerUrl).toMatch(/^https?:\/\//);
			});
		});
	});

	describe('Supported Chains', () => {
		it('should have all networks defined', () => {
			expect(Object.keys(SUPPORTED_CHAINS).length).toBeGreaterThan(0);
		});

		it('should have consistent chain IDs', () => {
			Object.entries(SUPPORTED_CHAINS).forEach(([key, chain]) => {
				if (NETWORK_CONFIGS[key]) {
					expect(chain.chainId).toBe(NETWORK_CONFIGS[key].chainId);
				}
			});
		});

		it('should have native currency info', () => {
			Object.values(SUPPORTED_CHAINS).forEach((chain) => {
				expect(chain.nativeCurrency).toBeDefined();
				expect(chain.nativeCurrency.symbol).toBeDefined();
				expect(chain.nativeCurrency.decimals).toBe(18);
			});
		});
	});

	describe('Common dAPIs', () => {
		it('should have common price feeds', () => {
			expect(COMMON_DAPIS).toContain('ETH/USD');
			expect(COMMON_DAPIS).toContain('BTC/USD');
			expect(COMMON_DAPIS).toContain('MATIC/USD');
		});

		it('should have reasonable number of feeds', () => {
			expect(COMMON_DAPIS.length).toBeGreaterThan(10);
			expect(COMMON_DAPIS.length).toBeLessThan(100);
		});

		it('should have consistent format', () => {
			COMMON_DAPIS.forEach((dapi) => {
				expect(dapi).toMatch(/^[A-Z0-9]+\/[A-Z]+$/);
			});
		});
	});

	describe('API Endpoints', () => {
		it('should have API3 Market endpoint', () => {
			expect(API_ENDPOINTS.API3_MARKET).toBeDefined();
			expect(API_ENDPOINTS.API3_MARKET).toMatch(/^https?:\/\//);
		});

		it('should have OEV Network endpoint', () => {
			expect(API_ENDPOINTS.OEV_NETWORK).toBeDefined();
			expect(API_ENDPOINTS.OEV_NETWORK).toMatch(/^https?:\/\//);
		});

		it('should have CoinGecko endpoint', () => {
			expect(API_ENDPOINTS.COINGECKO).toBeDefined();
			expect(API_ENDPOINTS.COINGECKO).toMatch(/^https?:\/\//);
		});
	});

	describe('Poll Intervals', () => {
		it('should have fast, normal, and slow intervals', () => {
			expect(POLL_INTERVALS.FAST).toBeDefined();
			expect(POLL_INTERVALS.NORMAL).toBeDefined();
			expect(POLL_INTERVALS.SLOW).toBeDefined();
		});

		it('should have increasing intervals', () => {
			expect(POLL_INTERVALS.FAST).toBeLessThan(POLL_INTERVALS.NORMAL);
			expect(POLL_INTERVALS.NORMAL).toBeLessThan(POLL_INTERVALS.SLOW);
		});
	});

	describe('Cache TTL', () => {
		it('should have cache TTL values', () => {
			expect(CACHE_TTL).toBeDefined();
			expect(Object.keys(CACHE_TTL).length).toBeGreaterThan(0);
		});
	});

	describe('Default Decimals', () => {
		it('should be 18 for ERC20 standard', () => {
			expect(DEFAULT_DECIMALS).toBe(18);
		});
	});

	describe('Licensing Notice', () => {
		it('should contain BSL 1.1 reference', () => {
			expect(LICENSING_NOTICE).toContain('BSL 1.1');
		});

		it('should contain Velocity BPA', () => {
			expect(LICENSING_NOTICE).toContain('Velocity BPA');
		});

		it('should contain contact information', () => {
			expect(LICENSING_NOTICE).toContain('velobpa.com');
		});
	});
});
