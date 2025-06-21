import { vendorConfigMap } from '../src/configs';

describe('Vendor selector sanity', () => {
  for (const [id, cfg] of Object.entries(vendorConfigMap)) {
    it(`${id} selectors have day/week/month`, () => {
      const { priceDay, priceWeek, priceMonth } = cfg.selectors as any;
      expect(typeof priceDay).toBe('string');
      expect(priceDay.length).toBeGreaterThan(0);
      expect(typeof priceWeek).toBe('string');
      expect(priceWeek.length).toBeGreaterThan(0);
      expect(typeof priceMonth).toBe('string');
      expect(priceMonth.length).toBeGreaterThan(0);
    });
  }
});
