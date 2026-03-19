import { fetchApiHealth, fetchApiStatus, fetchGatewayHealth, fetchGatewayStatus } from "./api";
import { webEnv } from "./env";
import type { PortalHealth, PortalServiceStatus } from "./types";

async function safeFetch<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export async function getStatusSnapshot() {
  const [apiHealth, apiStatus, gatewayHealth, gatewayStatus] = await Promise.all([
    safeFetch<PortalHealth>(() => fetchApiHealth(), {
      service: "api",
      status: "unreachable",
      timestamp: new Date().toISOString(),
      database: false,
      chain: false
    }),
    safeFetch<PortalServiceStatus>(() => fetchApiStatus(), {
      service: "fyxvo-api",
      environment: "development",
      solanaCluster: webEnv.solanaCluster,
      dependencies: {
        databaseConfigured: false,
        redisConfigured: false
      }
    }),
    safeFetch<PortalHealth>(() => fetchGatewayHealth(), {
      service: "gateway",
      status: "unreachable",
      timestamp: new Date().toISOString()
    }),
    safeFetch<PortalServiceStatus>(() => fetchGatewayStatus(), {
      service: "fyxvo-gateway",
      upstreamReachable: false,
      upstream: webEnv.gatewayBaseUrl,
      error: "Gateway status endpoint is currently unreachable."
    })
  ]);

  return {
    apiHealth,
    apiStatus,
    gatewayHealth,
    gatewayStatus
  };
}
