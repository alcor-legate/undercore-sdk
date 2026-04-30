/**
 * @undercore/sdk — Official TypeScript SDK for the Undercore API
 * Version 1.0.0 — Phase 125
 *
 * Zero runtime dependencies. Requires Node.js 18+ (native fetch).
 *
 * Usage:
 *   import { Undercore } from '@undercore/sdk';
 *   const uc = new Undercore({ apiKey: 'uc_live_...' });
 *   const works = await uc.works.list();
 *
 * Docs: https://developers.undercore.pro
 */

import type {
  UndercoreConfig,
  PaginationParams,
  Work,
  Writer,
  WorksResponse,
  WritersResponse,
  CatalogResponse,
} from "./types";

export * from "./types";

// ── Default configuration ──────────────────────────────────────

const DEFAULT_BASE_URL = "https://api.undercore.pro";
const DEFAULT_TIMEOUT_MS = 30_000;

// ── Error class ────────────────────────────────────────────────

/**
 * Error thrown when the Undercore API returns a non-2xx response.
 *
 * @example
 * try {
 *   await uc.works.get(99999);
 * } catch (err) {
 *   if (err instanceof UndercoreAPIError) {
 *     console.log(err.status); // 404
 *     console.log(err.detail); // "Obra no encontrada"
 *   }
 * }
 */
export class UndercoreAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(`Undercore API error ${status}: ${detail}`);
    this.name = "UndercoreAPIError";
    // Maintain proper prototype chain in ES5 transpiled output
    Object.setPrototypeOf(this, UndercoreAPIError.prototype);
  }
}

// ── Works resource ─────────────────────────────────────────────

/**
 * Methods for the /v1/works endpoints.
 * Scope required: read:works
 */
export interface WorksResource {
  /**
   * List works for your tenant (paginated).
   * @param params  Optional pagination parameters.
   */
  list(params?: PaginationParams): Promise<WorksResponse>;
  /**
   * Get a single work by its numeric ID.
   * @param id  Work ID (integer).
   */
  get(id: number): Promise<{ work: Work }>;
}

// ── Writers resource ───────────────────────────────────────────

/**
 * Methods for the /v1/writers endpoints.
 * Scope required: read:writers
 */
export interface WritersResource {
  /**
   * List writers for your tenant (paginated, ordered by name).
   * @param params  Optional pagination parameters.
   */
  list(params?: PaginationParams): Promise<WritersResponse>;
  /**
   * Get a single writer by their numeric ID.
   * @param id  Writer ID (integer).
   */
  get(id: number): Promise<{ writer: Writer }>;
}

// ── Main client ────────────────────────────────────────────────

/**
 * Undercore API client.
 *
 * @example
 * const uc = new Undercore({ apiKey: 'uc_live_...' });
 *
 * // List works
 * const { works, total } = await uc.works.list({ page: 1, per_page: 25 });
 *
 * // Get single work
 * const { work } = await uc.works.get(42);
 *
 * // List writers
 * const { writers } = await uc.writers.list();
 */
export class Undercore {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;
  private readonly _timeout: number;

  /** Access the /v1/works endpoints. Scope required: read:works */
  public readonly works: WorksResource;

  /** Access the /v1/writers endpoints. Scope required: read:writers */
  public readonly writers: WritersResource;

  constructor(config: UndercoreConfig) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new Error("Undercore SDK: apiKey is required");
    }
    this._apiKey = config.apiKey.trim();
    this._baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this._timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;

    // Bind resource namespaces
    this.works = {
      list: (params?: PaginationParams) =>
        this._request<WorksResponse>("/v1/works", params as Record<string, string | number | undefined>),
      get: (id: number) =>
        this._request<{ work: Work }>(`/v1/works/${id}`),
    };

    this.writers = {
      list: (params?: PaginationParams) =>
        this._request<WritersResponse>("/v1/writers", params as Record<string, string | number | undefined>),
      get: (id: number) =>
        this._request<{ writer: Writer }>(`/v1/writers/${id}`),
    };
  }

  /**
   * Get the API catalog — lists available v1 endpoints for your key.
   */
  async catalog(): Promise<CatalogResponse> {
    return this._request<CatalogResponse>("/v1/");
  }

  /**
   * Low-level request method. Handles auth header, query params, timeout,
   * and error parsing. Used internally by works.* and writers.* methods.
   *
   * T-125-04: API key is passed in header, never in URL.
   * T-125-06: Key is never logged or sent to analytics.
   */
  private async _request<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(this._baseUrl + path);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": this._apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort =
        err instanceof Error && err.name === "AbortError";
      throw new Error(
        isAbort
          ? `Undercore SDK: request timed out after ${this._timeout}ms`
          : `Undercore SDK: network error — ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json() as { detail?: string };
        detail = body.detail ?? detail;
      } catch {
        // Could not parse error body — use status text
        detail = response.statusText || detail;
      }
      throw new UndercoreAPIError(response.status, detail);
    }

    return response.json() as Promise<T>;
  }
}
