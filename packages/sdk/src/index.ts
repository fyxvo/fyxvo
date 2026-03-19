export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ApiStatusResponse {
  service: string;
  environment: string;
  solanaCluster: string;
  dependencies: {
    databaseConfigured: boolean;
    redisConfigured: boolean;
  };
}

export interface GatewayStatusResponse {
  service: string;
  upstreamReachable: boolean;
  upstream: string;
  error?: string;
}

export interface RpcRequest<TParams = unknown> {
  readonly method: string;
  readonly params?: TParams;
  readonly id?: string | number;
}

export interface RpcSuccess<TResult> {
  readonly jsonrpc: "2.0";
  readonly id: string | number | null;
  readonly result: TResult;
}

export interface RpcFailure {
  readonly jsonrpc: "2.0";
  readonly id: string | number | null;
  readonly error: {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
  };
}

export type RpcResponse<TResult> = RpcSuccess<TResult> | RpcFailure;

export interface RequestOptions {
  readonly method?: HttpMethod;
  readonly path?: string;
  readonly query?: Record<string, string | number | boolean | undefined>;
  readonly body?: unknown;
  readonly headers?: HeadersInit;
  readonly signal?: AbortSignal;
}

export interface FyxvoClientOptions {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly headers?: HeadersInit;
  readonly fetcher?: typeof fetch;
}

export class FyxvoError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "FyxvoError";
  }
}

export class FyxvoApiError extends FyxvoError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, "api_error", status, details);
    this.name = "FyxvoApiError";
  }
}

export class FyxvoNetworkError extends FyxvoError {
  constructor(message: string, details?: unknown) {
    super(message, "network_error", undefined, details);
    this.name = "FyxvoNetworkError";
  }
}

export class FyxvoTimeoutError extends FyxvoError {
  constructor(timeoutMs: number) {
    super(`The request exceeded the timeout of ${timeoutMs}ms.`, "timeout_error");
    this.name = "FyxvoTimeoutError";
  }
}

export function isFyxvoError(error: unknown): error is FyxvoError {
  return error instanceof FyxvoError;
}

export class FyxvoClient {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Headers;

  constructor(private readonly options: FyxvoClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.defaultHeaders = new Headers(options.headers);

    if (options.apiKey) {
      this.defaultHeaders.set("x-api-key", options.apiKey);
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>({ path: "/health" });
  }

  async getApiStatus(): Promise<ApiStatusResponse> {
    return this.request<ApiStatusResponse>({ path: "/v1/status" });
  }

  async getGatewayHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>({ path: "/health" });
  }

  async getGatewayStatus(): Promise<GatewayStatusResponse> {
    return this.request<GatewayStatusResponse>({ path: "/v1/status" });
  }

  async rpc<TResult, TParams = unknown>(
    payload: RpcRequest<TParams>,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<RpcResponse<TResult>> {
    const requestId = payload.id ?? crypto.randomUUID();
    return this.request<RpcResponse<TResult>>({
      ...options,
      method: "POST",
      path: options.path ?? "/rpc",
      body: {
        jsonrpc: "2.0",
        id: requestId,
        method: payload.method,
        params: payload.params ?? []
      }
    });
  }

  async request<T>({
    method = "GET",
    path = "/",
    query,
    body,
    headers,
    signal
  }: RequestOptions): Promise<T> {
    const url = new URL(path, this.options.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const requestHeaders = new Headers(this.defaultHeaders);
    if (headers) {
      new Headers(headers).forEach((value, key) => requestHeaders.set(key, value));
    }

    if (body !== undefined && !requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("fyxvo-timeout"), this.timeoutMs);
    const forwardAbort = () => controller.abort(signal?.reason);

    signal?.addEventListener("abort", forwardAbort, { once: true });

    try {
      const response = await this.fetcher(url, {
        method,
        headers: requestHeaders,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new FyxvoApiError(
          `Request to ${url.toString()} failed with status ${response.status}.`,
          response.status,
          await parseResponseBody(response)
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await parseResponseBody(response)) as T;
    } catch (error: unknown) {
      if (error instanceof FyxvoError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw signal?.aborted ? new FyxvoNetworkError("The request was aborted.", error) : new FyxvoTimeoutError(this.timeoutMs);
      }

      throw new FyxvoNetworkError(
        error instanceof Error ? error.message : "The request failed before a response was received.",
        error
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", forwardAbort);
    }
  }
}

export function createFyxvoClient(options: FyxvoClientOptions): FyxvoClient {
  return new FyxvoClient(options);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
