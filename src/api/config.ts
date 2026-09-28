// =============================================================================
// Environment Config — all values come from .env.development or .env.production
//
// To switch environment, just use a different build command:
//   npm run dev          → development (test server, /uitest/)
//   npm run build        → production  (prod server, /ui/)
//   npm run build:test   → test build  (test server, /uitest/)
//
// Edit the values in .env.development or .env.production — never change this file.
// =============================================================================

// ---------------------------------------------------------------------------
// Main REST backend  (India OSS Backend)
// ---------------------------------------------------------------------------
export const baseURL = import.meta.env.VITE_BACKEND_URL as string;

// ---------------------------------------------------------------------------
// WebSocket server
// Topology alarms WS endpoint derived from the same backend host.
// ---------------------------------------------------------------------------
export const baseURL_WS             = import.meta.env.VITE_BACKEND_WS_URL as string;
export const WS_TOPOLOGY_ALARMS_URL = `${baseURL}/ws/topo/alarms`;

// ---------------------------------------------------------------------------
// Global Login portal
// ---------------------------------------------------------------------------
export const GLOBAL_LOGIN_URL = import.meta.env.VITE_GLOBAL_LOGIN_URL as string;
export const PORTALS_URL      = import.meta.env.VITE_PORTALS_URL      as string;

// ---------------------------------------------------------------------------
// SAML / Global Auth backend
// Used for logout and direct auth-service calls (samlAxios in axiosClient.ts).
// ---------------------------------------------------------------------------
export const SAML_BASE_URL = import.meta.env.VITE_SAML_BASE_URL as string;
