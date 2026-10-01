import { rpc } from '@stellar/stellar-sdk';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { SorobanClient } from './soroban-client.js';

describe('SorobanClient', () => {
  afterEach(() => {
    // Clean up module cache after each test to ensure config is re-parsed
    vi.resetModules();
  });

  it('sets a finite timeout on the SDK RPC transport', () => {
    new SorobanClient('https://soroban.example.test');

    expect(rpc.AxiosClient.defaults.timeout).toBe(30_000);
  });

  describe('Bug Condition Exploration - Production HTTP Silent Acceptance', () => {
    beforeEach(() => {
      // Reset NODE_ENV and clear module cache so config is re-parsed fresh
      process.env.NODE_ENV = 'production';
      vi.resetModules();
    });

    it('should reject HTTP in production with ConfigError (bug fix verification)', async () => {
      // This test verifies that the bug is FIXED:
      // After implementing the fix, SorobanClient should throw ConfigError when:
      // 1. URL starts with http://
      // 2. NODE_ENV is production
      //
      // This test will PASS on FIXED code (error is thrown as expected)
      // This test would FAIL on UNFIXED code (error is NOT thrown, proving the bug existed)

      // Import fresh config for this test
      const { SorobanClient: SC } = await import('./soroban-client.js');

      const httpUrl = 'http://localhost:8000';

      // After fix: SHOULD throw a ConfigError for HTTP in production
      expect(() => {
        new SC(httpUrl);
      }).toThrow();

      // Verify it's a BlockchainError with the right message
      expect(() => {
        new SC(httpUrl);
      }).toThrow(/HTTPS in production/);

      expect(() => {
        new SC(httpUrl);
      }).toThrow(/http:\/\//);
    });

    it('should provide remediation guidance in error message', async () => {
      const { SorobanClient: SC } = await import('./soroban-client.js');

      const httpUrl = 'http://example.com:8000';

      try {
        new SC(httpUrl);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = String((error as Error).message);
        expect(message).toContain('HTTPS');
        expect(message).toContain('production');
        expect(message).toContain('SECURITY.md');
      }
    });
  });

  describe('Preservation Property Tests - Non-Production HTTP and All HTTPS Behavior', () => {
    // These tests verify baseline behavior on UNFIXED code to ensure we don't
    // break existing functionality when implementing the fix.
    // All of these tests should PASS on UNFIXED code and continue to PASS after fix.

    describe('HTTPS in Production Environment', () => {
      beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = 'production';
      });

      it('should initialize successfully with HTTPS URL in production', () => {
        const httpsUrl = 'https://soroban-testnet.stellar.org';

        let clientInstance: SorobanClient | undefined;
        expect(() => {
          clientInstance = new SorobanClient(httpsUrl);
        }).not.toThrow();

        expect(clientInstance).toBeDefined();
        expect(clientInstance?.raw).toBeDefined();
        expect(clientInstance?.raw).toBeInstanceOf(rpc.Server);
      });

      it('should create a valid server instance for HTTPS in production', () => {
        const httpsUrl = 'https://soroban.example.test';

        const client = new SorobanClient(httpsUrl);

        expect(client.raw).toBeInstanceOf(rpc.Server);
        expect(rpc.AxiosClient.defaults.timeout).toBe(30_000);
      });
    });

    describe('HTTPS in Development Environment', () => {
      beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = 'development';
      });

      it('should initialize successfully with HTTPS URL in development', () => {
        const httpsUrl = 'https://soroban-testnet.stellar.org';

        let clientInstance: SorobanClient | undefined;
        expect(() => {
          clientInstance = new SorobanClient(httpsUrl);
        }).not.toThrow();

        expect(clientInstance).toBeDefined();
        expect(clientInstance?.raw).toBeDefined();
        expect(clientInstance?.raw).toBeInstanceOf(rpc.Server);
      });
    });

    describe('HTTPS in Test Environment', () => {
      beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = 'test';
      });

      it('should initialize successfully with HTTPS URL in test', () => {
        const httpsUrl = 'https://soroban-testnet.stellar.org';

        let clientInstance: SorobanClient | undefined;
        expect(() => {
          clientInstance = new SorobanClient(httpsUrl);
        }).not.toThrow();

        expect(clientInstance).toBeDefined();
        expect(clientInstance?.raw).toBeDefined();
        expect(clientInstance?.raw).toBeInstanceOf(rpc.Server);
      });
    });

    describe('HTTP in Development Environment', () => {
      beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = 'development';
      });

      it('should initialize successfully with HTTP URL in development', () => {
        const httpUrl = 'http://localhost:8000';

        let clientInstance: SorobanClient | undefined;
        expect(() => {
          clientInstance = new SorobanClient(httpUrl);
        }).not.toThrow();

        expect(clientInstance).toBeDefined();
        expect(clientInstance?.raw).toBeDefined();
        expect(clientInstance?.raw).toBeInstanceOf(rpc.Server);
      });

      it('should create valid server instance with HTTP in development', () => {
        const httpUrl = 'http://localhost:8000';

        const client = new SorobanClient(httpUrl);

        expect(client.raw).toBeInstanceOf(rpc.Server);
        expect(rpc.AxiosClient.defaults.timeout).toBe(30_000);
      });
    });

    describe('HTTP in Test Environment', () => {
      beforeEach(() => {
        vi.resetModules();
        process.env.NODE_ENV = 'test';
      });

      it('should initialize successfully with HTTP URL in test', () => {
        const httpUrl = 'http://localhost:8000';

        let clientInstance: SorobanClient | undefined;
        expect(() => {
          clientInstance = new SorobanClient(httpUrl);
        }).not.toThrow();

        expect(clientInstance).toBeDefined();
        expect(clientInstance?.raw).toBeDefined();
        expect(clientInstance?.raw).toBeInstanceOf(rpc.Server);
      });

      it('should create valid server instance with HTTP in test', () => {
        const httpUrl = 'http://localhost:8000';

        const client = new SorobanClient(httpUrl);

        expect(client.raw).toBeInstanceOf(rpc.Server);
        expect(rpc.AxiosClient.defaults.timeout).toBe(30_000);
      });
    });
  });
});
