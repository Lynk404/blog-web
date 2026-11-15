/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string
  readonly VITE_APP_FILE_UPLOAD_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
