/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_SAFE_BROWSING_API_KEY: string;
  readonly VITE_ISTHISSPAM_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
