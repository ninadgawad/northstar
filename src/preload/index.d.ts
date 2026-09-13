export interface NorthstarApi {
  appVersion: string;
}

declare global {
  interface Window {
    api: NorthstarApi;
  }
}
