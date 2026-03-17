/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_ENABLE_MOCK?: string
  readonly VITE_USE_AR?: string
  readonly VITE_I18N_DEFAULT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any
    'a-entity': any
    'a-camera': any
    'a-box': any
    'a-sphere': any
    'a-cylinder': any
    'a-plane': any
    'a-sky': any
    'a-light': any
    'a-gltf-model': any
  }
}
