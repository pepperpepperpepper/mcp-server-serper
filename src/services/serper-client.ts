import fetch from "node-fetch";
import {
  ISearchParams,
  ISearchParamsBatch,
  ISearchResult,
  ISearchResultBatch,
  IScrapeParams,
  IScrapeResult,
} from "../types/serper.js";

/**
 * Interface for Serper API client to allow mocking in tests.
 */
export interface ISerperClient {
  /** Perform a web search using Serper API */
  search(params: ISearchParams): Promise<ISearchResult>;
  /** Perform a batch web search using Serper API */
  batchSearch(batchParams: ISearchParamsBatch): Promise<ISearchResultBatch>;
  /** Scrape a URL using Serper API */
  scrape(params: IScrapeParams): Promise<IScrapeResult>;
}

/**
 * Implementation of Serper API client.
 */
export class SerperClient implements ISerperClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Initialize Serper API client.
   * @param apiKey - Serper API key for authentication
   * @param baseUrl - Base URL for Serper API (optional)
   */
  constructor(apiKey: string, baseUrl: string = "https://google.serper.dev") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Perform a web search using Serper API.
   * @param params - Search parameters
   * @returns Promise resolving to search results
   * @throws Error if API request fails
   */
  async search(params: ISearchParams): Promise<ISearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Serper API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as ISearchResult;
      return data;
    } catch (error) {
      console.error("Serper search failed:", error);
      throw error;
    }
  }

  /**
   * Perform a web search using Serper API.
   * @param batchParams - Search parameters
   * @returns Promise resolving to search results
   * @throws Error if API request fails
   */
  async batchSearch(
    batchParams: ISearchParamsBatch
  ): Promise<ISearchResultBatch> {
    if (!batchParams.length) {
      throw new Error("Batch search requires at least one query");
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify(batchParams),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Serper API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as ISearchResultBatch;
      return data;
    } catch (error) {
      console.error("Serper search failed:", error);
      throw error;
    }
  }

  /**
   * Scrape a URL using Serper API.
   * @param params - Scrape parameters
   * @returns Promise resolving to scrape result
   * @throws Error if API request fails
   */
  async scrape(params: IScrapeParams): Promise<IScrapeResult> {
    if (!params.url) {
      throw new Error("URL is required for scraping");
    }
    try {
      const response = await fetch("https://scrape.serper.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify(params),
        redirect: "follow",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Serper API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
      const result = (await response.json()) as IScrapeResult;
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
