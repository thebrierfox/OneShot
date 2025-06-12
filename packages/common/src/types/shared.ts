export interface RawProduct {
  url: string;
  name: string | null;
  price: number | null;
  sku: string | null;
  vendor: string;
}

export interface CleanProduct {
  url: string;
  name: string;
  price: number;
  sku: string;
  vendor: string;
} 