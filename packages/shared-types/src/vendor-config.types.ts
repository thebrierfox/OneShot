export interface PriceTier {
  perDay?: number | null;
  perWeek?: number | null;
  perMonth?: number | null;
}

export interface RateMeta {
  vendorId: string;
  branchId: string;
  zipCode: string;
  startDate: string;   // ISO
  endDate: string;     // ISO
}

export interface RawScrapedProduct {
  sku: string;
  name?: string;
  rates: PriceTier;
  meta: RateMeta;
}

export interface VendorConfig {
  id: string;           // "sunbelt"
  displayName: string;  // "Sunbelt Rentals"
  baseUrl: string;
  customParser?: (input: {
    url: string;
    dateStart: string;
    dateEnd: string;
    zipCode: string;
    branchId?: string;
  }) => Promise<RawScrapedProduct>;
}

export type VendorConfigMap = Record<string, VendorConfig>;
