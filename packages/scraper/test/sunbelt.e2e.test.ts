import { scrapeProductPageActivity } from '../src/temporal/activities';
import { mock, instance, when, anything } from 'ts-mockito';
import { Context } from '@temporalio/activity';
import { BrowserFactory } from '../src/browser/playwright-factory';
import { sunbeltConfig } from '../src/configs/sunbelt.config';
import { RawScrapedProduct } from '@patriot-rentals/shared-types';

// Note: This is an E2E test and will make a live internet request.
// It requires the Docker services to be running for Browserless connection.

describe('Sunbelt Scraper E2E', () => {
  // Increase timeout for a live E2E test to its maximum
  jest.setTimeout(2147483647);

  // Create a mock Temporal Context to isolate the test from the real environment
  const mockContext = mock(Context);
  when(mockContext.heartbeat(anything())).thenReturn();
  when(mockContext.log).thenReturn(console);
  const contextInstance = instance(mockContext);

  afterAll(async () => {
    // Gracefully close the browser managed by the factory after all tests
    await BrowserFactory.closeBrowser();
  });

  it('should successfully scrape a Sunbelt PDP by handling the price modal', async () => {
    const input = {
      ...sunbeltConfig,
      vendorId: 'sunbelt',
      // Using a known URL from our analysis
      url: 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/',
    };

    let result: RawScrapedProduct | undefined;
    let error;

    try {
      // Pass the mocked context and the full config to the activity
      result = await scrapeProductPageActivity(input, contextInstance);
    } catch (e) {
      error = e;
    }

    // Expect no error to be thrown
    expect(error).toBeUndefined();

    // Expect a successful result object
    expect(result).toBeDefined();
    expect(result?.vendorId).toBe('sunbelt');
    expect(result?.url).toBe(input.url);

    // Check that we got price data from the API
    expect(result?.rawPriceDay).not.toBeNull();
    expect(result?.rawPriceWeek).not.toBeNull();
    expect(result?.rawPriceMonth).not.toBeNull();

    console.log('Sunbelt E2E Test Passed. Prices found:', {
      day: result?.rawPriceDay,
      week: result?.rawPriceWeek,
      month: result?.rawPriceMonth,
    });
  });
}); 