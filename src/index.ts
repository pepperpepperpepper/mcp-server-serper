#!/usr/bin/env node

/**
 * MCP server implementation that provides web search capabilities via Serper API.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SerperClient } from "./services/serper-client.js";
import { SerperSearchTools } from "./tools/search-tool.js";
import { ISearchParamsBatch } from "./types/serper.js";

// Initialize Serper client with API key from environment
const serperApiKey = process.env.SERPER_API_KEY;
if (!serperApiKey) {
  throw new Error("SERPER_API_KEY environment variable is required");
}

// Create Serper client and search tool
const serperClient = new SerperClient(serperApiKey);
const searchTools = new SerperSearchTools(serperClient);

// Create MCP server
const server = new Server(
  {
    name: "Serper MCP Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "webSearch" tool for performing web searches.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Define input schema for search tool
  const searchInputSchema = {
    type: "object",
    properties: {
      q: {
        type: "string",
        description: "Search query string",
      },
      gl: {
        type: "string",
        description:
          "Optional region code for search results in ISO 3166-1 alpha-2 format (e.g., 'us')",
      },
      hl: {
        type: "string",
        description:
          "Optional language code for search results in ISO 639-1 format (e.g., 'en')",
      },
      location: {
        type: "string",
        description:
          "Optional location for search results (e.g., 'SoHo, New York, United States', 'California, United States')",
      },
      num: {
        type: "number",
        description: "Number of results to return (default: 10)",
      },
      tbs: {
        type: "string",
        description:
          "Time-based search filter ('qdr:h' for past hour, 'qdr:d' for past day, 'qdr:w' for past week, 'qdr:m' for past month, 'qdr:y' for past year)",
      },
      page: {
        type: "number",
        description: "Page number of results to return (default: 1)",
      },
      autocorrect: {
        type: "boolean",
        description: "Whether to autocorrect spelling in query",
      },
    },
    required: ["q", "gl", "hl"],
  };

  // Return list of tools with input schemas
  return {
    tools: [
      {
        name: "google_search",
        description:
          "Tool to perform web searches via Serper API and retrieve rich results. It is able to retrieve organic search results, people also ask, related searches, and knowledge graph.",
        inputSchema: searchInputSchema,
      },
      {
        name: "batch_google_search",
        description:
          "Tool to perform batch web searches via Serper API and retrieve rich results. It is able to retrieve organic search results, people also ask, related searches, and knowledge graph for each query.",
        inputSchema: {
          type: "array",
          items: searchInputSchema,
        },
      },
      {
        name: "scrape",
        description:
          "Tool to scrape a webpage and retrieve the text and, optionally, the markdown content. It will retrieve also the JSON-LD metadata and the head metadata.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL of the webpage to scrape.",
            },
            includeMarkdown: {
              type: "boolean",
              description: "Whether to include markdown content.",
              default: false,
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

/**
 * Handler for the webSearch tool.
 * Performs a web search using Serper API and returns results.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "google_search": {
      const q = String(request.params.arguments?.query);
      const gl = request.params.arguments?.gl as string | undefined;
      const hl = request.params.arguments?.hl as string | undefined;
      const location = request.params.arguments?.location as string | undefined;
      const num = request.params.arguments?.num as number | undefined;
      const tbs = request.params.arguments?.tbs as
        | "qdr:h"
        | "qdr:d"
        | "qdr:w"
        | "qdr:m"
        | "qdr:y"
        | undefined;
      const page = request.params.arguments?.page as number | undefined;
      const autocorrect = request.params.arguments?.autocorrect as
        | boolean
        | undefined;

      if (!q || !gl || !hl) {
        throw new Error(
          "Search query and region code and language are required"
        );
      }

      try {
        const result = await searchTools.search({
          q,
          gl,
          hl,
          location,
          num,
          tbs,
          page,
          autocorrect,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Search failed: ${error}`);
      }
    }

    case "batch_google_search": {
      const queries = request.params.arguments?.queries as ISearchParamsBatch;
      const results = await searchTools.batchSearch(queries);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case "scrape": {
      const url = request.params.arguments?.url as string;
      const includeMarkdown = request.params.arguments
        ?.includeMarkdown as boolean;
      const result = await searchTools.scrape({ url, includeMarkdown });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
