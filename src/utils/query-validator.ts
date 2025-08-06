/**
 * Query validation and sanitization utilities
 */

/**
 * Validates and sanitizes search query parameters
 */
export class QueryValidator {
  /**
   * Sanitizes a search query to prevent formatting issues
   */
  static sanitizeQuery(query: string): string {
    if (!query || typeof query !== "string") {
      throw new Error("Query must be a non-empty string")
    }

    return query
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/"{2,}/g, '"') // Fix double quotes
      .replace(/'{2,}/g, "'") // Fix single quotes
      .replace(/[^\w\s\-"'@.:/]/g, "") // Remove problematic characters
      .replace(/^["']|["']$/g, "") // Remove leading/trailing quotes
      .trim()
  }

  /**
   * Validates search parameters
   */
  static validateSearchParams(params: any): void {
    if (!params || typeof params !== "object") {
      throw new Error("Parameters must be an object")
    }

    if (!params.q || typeof params.q !== "string") {
      throw new Error('Query parameter "q" is required and must be a string')
    }

    const sanitizedQuery = this.sanitizeQuery(params.q)
    if (sanitizedQuery.length === 0) {
      throw new Error("Query cannot be empty after sanitization")
    }

    if (sanitizedQuery.length > 500) {
      throw new Error("Query is too long (max 500 characters)")
    }
  }

  /**
   * Quick validation for common query issues
   */
  static quickValidate(query: string): { valid: boolean; error?: string; sanitized?: string } {
    try {
      const sanitized = this.sanitizeQuery(query)
      return { valid: true, sanitized }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
