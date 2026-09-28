/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_BACKEND_WS_URL: string;
  readonly VITE_GLOBAL_LOGIN_URL: string;
  readonly VITE_PORTALS_URL: string;
  readonly VITE_SAML_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
