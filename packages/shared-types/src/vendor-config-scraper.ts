import type { VendorConfig } from './models';

export interface ScraperVendorConfig extends VendorConfig {
  playwrightContextOptions?: Record<string, any>;
  crawlerOptions?: Record<string, any>;
  networkIntercepts?: any[];
  customParser?: any;
  isProductPageChecker?: any;
}

export type ScraperVendorConfigMap = Record<string, ScraperVendorConfig>; 