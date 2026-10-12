/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_MAYAR_CHECKOUT_ENDPOINT?: string;
  readonly VITE_GOOGLE_DRIVE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
