/**
 * Configuration for parsing rate strings.
 */
export interface RateParsingConfig {
  currencySymbol?: string;
  decimalSeparator?: string;
  thousandSeparator?: string;
}

/**
 * Parses a string or number to extract a numerical price.
 * Returns null if the input is not a valid number.
 * @param priceInput The raw price input (string or number).
 * @param config Optional configuration for parsing.
 * @returns The parsed number or null.
 */
export function parsePriceString(
  priceInput: string | number | undefined | null,
  config?: RateParsingConfig,
): number | null {
  if (priceInput === null || priceInput === undefined) {
    return null;
  }
  if (typeof priceInput === 'number') {
    return isNaN(priceInput) ? null : priceInput;
  }

  const currencySymbol = config?.currencySymbol || '$';
  const thousandSeparator = config?.thousandSeparator || ',';
  
  // Create a regex to remove currency symbol and thousand separators
  const cleanRegex = new RegExp(`\\${currencySymbol}|\\${thousandSeparator}`, 'g');
  const cleanedString = priceInput.replace(cleanRegex, '').trim();

  const numericValue = parseFloat(cleanedString);

  return isNaN(numericValue) ? null : numericValue;
} 