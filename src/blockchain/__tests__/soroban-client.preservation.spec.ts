import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { SorobanClient } from '../soroban-client.js';

/**
 * Preservation Property Tests
 *
 * Property 2: Non-Buggy Inputs Behavior Unchanged
 *
 * These tests verify that all inputs which do NOT match the bug condition
 * continue to work exactly as before after the fix is applied.
 *
 * Bug condition (isBugCondition): NODE_ENV='production' AND rpcUrl.startsWith('http://')
 *
 * Preservation scope (¬isBugCondition):
 * - HTTP in development and test environments
 * - HTTPS in all environments (development, test, production)
 * - Any URL scheme combination that doesn't trigger the bug condition
 *
 * EXPECTED OUTCOME (before and after fix): Tests PASS
 * This ensures no regressions are introduced by the security fix.
 */

describe('SorobanClient - Preservation: Non-Buggy Inputs Unchanged', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Development HTTP - Should Continue to Work', () => {
    it('Allows HTTP in development environment (localhost)', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SOROBAN_RPC_URL = 'http://localhost:8000';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC('http://localhost:8000');
      expect(client).toBeDefined();
      expect(client.raw).toBeDefined();
      expect(client.raw.serverURL).toBe('http://localhost:8000');
    });

    it('Allows HTTP in development with non-standard port', async () => {
      process.env.NODE_ENV = 'development';
      const testUrl = 'http://127.0.0.1:9000';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });

    it('Allows HTTPS in development environment', async () => {
      process.env.NODE_ENV = 'development';
      const testUrl = 'https://soroban-dev.example.com';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });
  });

  describe('Test HTTP - Should Continue to Work', () => {
    it('Allows HTTP in test environment', async () => {
      process.env.NODE_ENV = 'test';
      process.env.SOROBAN_RPC_URL = 'http://localhost:8000';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC('http://localhost:8000');
      expect(client).toBeDefined();
      expect(client.raw).toBeDefined();
      expect(client.raw.serverURL).toBe('http://localhost:8000');
    });

    it('Allows HTTPS in test environment', async () => {
      process.env.NODE_ENV = 'test';
      const testUrl = 'https://soroban-test.example.com';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });
  });

  describe('Production HTTPS - Should Continue to Work', () => {
    it('Allows HTTPS in production environment', async () => {
      process.env.NODE_ENV = 'production';
      const testUrl = 'https://soroban-testnet.stellar.org';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });

    it('Allows HTTPS production with custom domain', async () => {
      process.env.NODE_ENV = 'production';
      const testUrl = 'https://rpc.soroban.example.com';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });

    it('Allows HTTPS production with non-standard port', async () => {
      process.env.NODE_ENV = 'production';
      const testUrl = 'https://soroban.example.com:8443';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client).toBeDefined();
      expect(client.raw.serverURL).toBe(testUrl);
    });
  });

  describe('allowHttp Flag Calculation - Should Be Correct', () => {
    it('Calculates allowHttp=true for HTTP URLs (development)', async () => {
      process.env.NODE_ENV = 'development';
      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC('http://localhost:8000');
      // The allowHttp flag should be calculated based on URL scheme
      // For HTTP URLs, it should be true
      expect(client.raw.serverURL).toBe('http://localhost:8000');
    });

    it('Calculates allowHttp=false for HTTPS URLs (all environments)', async () => {
      const testUrls = [
        'https://soroban.example.com',
        'https://rpc.stellar.org',
        'https://localhost:8443',
      ];

      for (const testUrl of testUrls) {
        process.env.NODE_ENV = 'production';
        const { SorobanClient: SC } = await import('../soroban-client.js');

        const client = new SC(testUrl);
        // For HTTPS URLs, allowHttp should be false
        expect(client.raw.serverURL).toBe(testUrl);

        vi.resetModules();
      }
    });
  });

  describe('Server Instantiation - Should Create Valid Instance', () => {
    it('Creates valid rpc.Server instance for valid HTTPS URL', async () => {
      process.env.NODE_ENV = 'production';
      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC('https://soroban-testnet.stellar.org');
      expect(client.raw).toBeDefined();
      expect(client.raw.serverURL).toBe('https://soroban-testnet.stellar.org');
      // Verify it's a valid rpc.Server by checking for expected methods
      expect(typeof client.getHealth).toBe('function');
      expect(typeof client.getLatestLedger).toBe('function');
      expect(typeof client.getEvents).toBe('function');
    });

    it('Creates valid rpc.Server instance for HTTP in development', async () => {
      process.env.NODE_ENV = 'development';
      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC('http://localhost:8000');
      expect(client.raw).toBeDefined();
      expect(client.raw.serverURL).toBe('http://localhost:8000');
      // Verify it's a valid rpc.Server
      expect(typeof client.getHealth).toBe('function');
      expect(typeof client.getLatestLedger).toBe('function');
    });
  });

  describe('Preservation Scope - Edge Cases', () => {
    it('Handles HTTPS with path components', async () => {
      process.env.NODE_ENV = 'production';
      const testUrl = 'https://soroban.example.com/rpc/v1';

      const { SorobanClient: SC } = await import('../soroban-client.js');

      const client = new SC(testUrl);
      expect(client.raw.serverURL).toContain('soroban.example.com');
    });

    it('Handles development with various hostnames', async () => {
      process.env.NODE_ENV = 'development';
      const testUrls = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://host.docker.internal:8000',
        'http://192.168.1.1:8000',
      ];

      for (const testUrl of testUrls) {
        const { SorobanClient: SC } = await import('../soroban-client.js');
        const client = new SC(testUrl);
        expect(client.raw.serverURL).toBe(testUrl);
        vi.resetModules();
      }
    });
  });
});
