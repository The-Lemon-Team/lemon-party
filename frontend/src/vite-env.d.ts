/// <reference types="vite/client" />

interface ElectronTokenStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface ElectronAPI {
  isElectron: boolean;
  tokenStorage?: ElectronTokenStorage;
}

interface Window {
  electronAPI?: ElectronAPI;
}

interface ImportMetaEnv {
  readonly VITE_SHELL?: string;
  readonly VITE_API_BASE?: string;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module 'mfe_telegram/TelegramExportViewer' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

