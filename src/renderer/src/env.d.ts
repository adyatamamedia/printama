/// <reference types="vite/client" />
import type { api } from '../../preload/index'

declare global {
  interface Window {
    electron: any
    api: typeof api
  }
}
