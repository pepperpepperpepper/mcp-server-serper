import { SerperClient } from './serper-client.js';
import { ISearchParams, ISearchParamsBatch } from '../types/serper.js';
import dotenv from 'dotenv';
dotenv.config();

describe('SerperClient Integration Tests', () => {
  const apiKey = process.env.SERPER_API_KEY || '';
  let client: SerperClient;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('SERPER_API_KEY environment variable is required for integration tests');
    }
    client = new SerperClient(apiKey);
  });

  describe('search', () => {
    it('should perform a basic search successfully', async () => {
      const params: ISearchParams = {
        q: 'OpenAI ChatGPT',
      };

      const result = await client.search(params);

      expect(result).toBeDefined();
      expect(result.searchParameters).toBeDefined();
      expect(result.searchParameters.q).toBe(params.q);
      expect(Array.isArray(result.organic)).toBe(true);
      expect(result.organic.length).toBeGreaterThan(0);
      
      // Verify organic result structure
      const firstResult = result.organic[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('link');
      expect(firstResult).toHaveProperty('snippet');
      expect(firstResult).toHaveProperty('position');
    }, 10000);

    it('should handle search with optional parameters', async () => {
      const params: ISearchParams = {
        q: 'restaurants',
        gl: 'us',
        hl: 'en',
        location: 'New York',
        num: 5,
      };

      const result = await client.search(params);

      expect(result.searchParameters).toMatchObject({
        q: params.q,
        gl: params.gl,
        hl: params.hl,
        location: params.location,
        num: params.num,
      });
      expect(result.organic.length).toBeLessThanOrEqual(params.num || 10);
    }, 10000);

    it('should handle non-Latin characters in search query', async () => {
      const params: ISearchParams = {
        q: '東京 レストラン',
      };

      const result = await client.search(params);

      expect(result).toBeDefined();
      expect(result.organic.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle error for invalid API key', async () => {
      const invalidClient = new SerperClient('invalid-key');
      const params: ISearchParams = {
        q: 'test query',
      };

      await expect(invalidClient.search(params)).rejects.toThrow();
    }, 10000);
  });

  describe('batchSearch', () => {
    it('should perform batch search successfully', async () => {
      const batchParams: ISearchParamsBatch = [
        { q: 'artificial intelligence' },
        { q: 'machine learning', gl: 'us', hl: 'en' },
      ];

      const results = await client.batchSearch(batchParams);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(batchParams.length);

      // Verify first query results
      expect(results[0].searchParameters.q).toBe(batchParams[0].q);
      expect(results[0].organic.length).toBeGreaterThan(0);

      // Verify second query results with optional params
      expect(results[1].searchParameters).toMatchObject({
        q: batchParams[1].q,
        gl: batchParams[1].gl,
        hl: batchParams[1].hl,
      });
      expect(results[1].organic.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle empty batch array', async () => {
      const emptyBatch: ISearchParamsBatch = [];
      await expect(client.batchSearch(emptyBatch)).rejects.toThrow();
    }, 10000);
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const clientWithInvalidUrl = new SerperClient(apiKey, 'https://invalid.url');
      const params: ISearchParams = {
        q: 'test query',
      };

      await expect(clientWithInvalidUrl.search(params)).rejects.toThrow();
    }, 10000);

    it('should handle malformed request', async () => {
      const invalidParams = {
        q: '',  // Empty query should cause an error
      };

      await expect(client.search(invalidParams)).rejects.toThrow();
    }, 10000);
  });
});
