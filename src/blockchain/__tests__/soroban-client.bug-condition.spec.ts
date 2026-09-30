import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { SorobanClient } from '../soroban-client.js';
import { BlockchainError } from '../../shared/errors/index.js';

/**
 * Bug Condition Exploration Tests
 *
 * Property 1: HTTP URLs Rejected in Production
 *
 * These tests surface counterexamples that demonstrate the bug exists:
 * HTTP connections are silently allowed in production environments.
 *
 * EXPECTED OUTCOME (on unfixed code): Tests FAIL - this proves the bug exists
 *
 * After the fix is implemented, these tests will PASS, confirming that:
 * 1. The bug condition is correctly identified
 * 2. The fix properly rejects HTTP in production
 * 3. The error message is clear and descriptive
 */

describe('SorobanClient - Bug Condition: HTTP in Production', () => {
  // Mock environment variables for testing
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear cached config so new environment is picked up
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Production HTTP - Bug Condition (HTTP_PRODUCTION_x)', () => {
    it('HTTP_PRODUCTION_1: Rejects HTTP URL in production with descriptive error', async () => {
      // This test FAILS on unfixed code - constructor accepts HTTP in production
      // After fix, it PASSES - constructor throws BlockchainError
      process.env.NODE_ENV = 'production';
      process.env.SOROBAN_RPC_URL = 'http://soroban.example.com';

      // Dynamically import after environment is set
      const { SorobanClient: SC } = await import('../soroban-client.js');

      expect(() => {
        new SC('http://soroban.example.com');
      }).toThrow();

      // Verify the error is BlockchainError with proper message
      expect(() => {
        new SC('http://soroban.example.com');
      }).toThrow(/HTTP URLs are not allowed in production/i);
    });

    it('HTTP_PRODUCTION_2: Rejects HTTP localhost in production', async () => {
      // Counterexample: HTTP with non-standard port
      process.env.NODE_ENV = 'production';
      process.env.SOROBAN_RPC_URL = 'http://localhost:8080';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      expect(() => {
        new SC('http://localhost:8080');
      }).toThrow(/HTTP URLs are not allowed in production/i);
    });

    it('HTTP_PRODUCTION_3: Rejects HTTP IP address in production', async () => {
      // Counterexample: HTTP with IP address
      process.env.NODE_ENV = 'production';
      process.env.SOROBAN_RPC_URL = 'http://192.168.1.1:8000';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      expect(() => {
        new SC('http://192.168.1.1:8000');
      }).toThrow(/HTTP URLs are not allowed in production/i);
    });

    it('Includes received URL in error message for debugging', async () => {
      process.env.NODE_ENV = 'production';
      const testUrl = 'http://misconfigured-rpc.example.com';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      try {
        new SC(testUrl);
        throw new Error('Should have thrown BlockchainError');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(testUrl);
        expect((error as Error).message).toContain('HTTPS');
      }
    });
  });

  describe('Counterexample Documentation', () => {
    it('Documents: HTTP silently accepted in production (unfixed code)', () => {
      // This documents what we observe on UNFIXED code:
      // - Constructor completes without error when given HTTP URL in production
      // - No validation layer exists to check NODE_ENV
      // - allowHttp parameter is calculated only from URL scheme
      //
      // After fix: This behavior changes - constructor throws immediately
      const evidence = {
        file: 'src/blockchain/soroban-client.ts',
        line: 22,
        code: "new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') })",
        problem: 'No NODE_ENV check before instantiating rpc.Server',
        rootCause: 'Missing validateRpcUrlForEnvironment() function',
        fix: 'Add validation before rpc.Server instantiation',
      };

      expect(evidence.problem).toBeDefined();
      expect(evidence.rootCause).toBeDefined();
      expect(evidence.fix).toBeDefined();
    });
  });
});
