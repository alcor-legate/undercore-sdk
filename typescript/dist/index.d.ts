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
import type { UndercoreConfig, PaginationParams, Work, Writer, WorksResponse, WritersResponse, CatalogResponse } from "./types";
export * from "./types";
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
export declare class UndercoreAPIError extends Error {
    readonly status: number;
    readonly detail: string;
    constructor(status: number, detail: string);
}
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
    get(id: number): Promise<{
        work: Work;
    }>;
}
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
    get(id: number): Promise<{
        writer: Writer;
    }>;
}
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
export declare class Undercore {
    private readonly _apiKey;
    private readonly _baseUrl;
    private readonly _timeout;
    /** Access the /v1/works endpoints. Scope required: read:works */
    readonly works: WorksResource;
    /** Access the /v1/writers endpoints. Scope required: read:writers */
    readonly writers: WritersResource;
    constructor(config: UndercoreConfig);
    /**
     * Get the API catalog — lists available v1 endpoints for your key.
     */
    catalog(): Promise<CatalogResponse>;
    /**
     * Low-level request method. Handles auth header, query params, timeout,
     * and error parsing. Used internally by works.* and writers.* methods.
     *
     * T-125-04: API key is passed in header, never in URL.
     * T-125-06: Key is never logged or sent to analytics.
     */
    private _request;
}
//# sourceMappingURL=index.d.ts.map