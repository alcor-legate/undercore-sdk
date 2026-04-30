/**
 * Undercore API — TypeScript type definitions
 * Phase 125 — @undercore/sdk v1.0.0
 *
 * Types mirror the exact response format of api.undercore.pro/v1/*
 * Work.status uses the 6 official CISAC lifecycle states (never "active" — deprecated).
 */

// ── Work ────────────────────────────────────────────────────────

/**
 * CISAC work lifecycle status values.
 * These 6 states are the official Undercore lifecycle (CISAC doctrine).
 * The legacy status "active" is deprecated and will never be returned.
 */
export type WorkStatus =
  | "draft"
  | "needs_review"
  | "documented"
  | "registered"
  | "conflict"
  | "archived";

/**
 * A musical work (composition) in the catalog.
 */
export interface Work {
  id: number;
  title: string;
  /** International Standard Musical Work Code — may be null for unregistered works. */
  iswc: string | null;
  /** CISAC lifecycle status. */
  status: WorkStatus;
  created_at: string;
  updated_at: string;
}

// ── Writer ──────────────────────────────────────────────────────

/**
 * A writer (composer or lyricist) registered in the catalog.
 */
export interface Writer {
  id: number;
  /** Writer name — displayed in UPPERCASE per Undercore convention. */
  name: string;
  /** IPI (Interested Parties Information) number — may be null. */
  ipi: string | null;
  /** Performing Rights Organization affiliation (e.g. ASCAP, BMI, SESAC). */
  pro_affiliation: string | null;
  created_at: string;
}

// ── Pagination ──────────────────────────────────────────────────

/**
 * Pagination metadata included in all list responses.
 */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

/**
 * Paginated list of works.
 */
export interface WorksResponse extends PaginationMeta {
  works: Work[];
}

/**
 * Paginated list of writers.
 */
export interface WritersResponse extends PaginationMeta {
  writers: Writer[];
}

// ── Configuration ───────────────────────────────────────────────

/**
 * Configuration for the Undercore SDK client.
 */
export interface UndercoreConfig {
  /** Your API key — obtain from portal.undercore.pro/settings/api-keys */
  apiKey: string;
  /**
   * Base URL for the Undercore API.
   * @default "https://api.undercore.pro"
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  /** Page number (1-indexed). @default 1 */
  page?: number;
  /** Items per page (max 200). @default 50 */
  per_page?: number;
}

// ── API Catalog ─────────────────────────────────────────────────

export interface CatalogEndpoint {
  path: string;
  method: string;
  description: string;
  scope_required?: string;
  params?: string[];
}

export interface CatalogResponse {
  service: string;
  version: string;
  tenant: string;
  scopes: string[];
  endpoints: CatalogEndpoint[];
  rate_limits: {
    tier: string;
    limits: Record<string, string>;
  };
  docs: string;
}
