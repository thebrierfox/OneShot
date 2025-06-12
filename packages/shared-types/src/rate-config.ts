export interface RateParsingConfig {
  currencySymbol?: string;
  decimalSeparator?: string;
  thousandSeparator?: string;
}

/** Fallback when a vendor gives no custom parsing rules */
export const DEFAULT_RATE_PARSING_CONFIG: RateParsingConfig = {
  currencySymbol: "$",
  decimalSeparator: ".",
  thousandSeparator: ",",
};
