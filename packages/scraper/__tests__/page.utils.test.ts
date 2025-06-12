import { safeClick, autoScroll } from '../src/utils/page.utils';

// Create a lightweight mock of Playwright Page with minimal surface for our utilities
class MockElementHandle {
  public clicked = false;
  async click() {
    this.clicked = true;
  }
}

class MockPage {
  public _selector: string | null = null;
  public _evaluateCalls: number = 0;

  async waitForSelector(selector: string, { timeout }: { timeout: number }) {
    this._selector = selector;
    // simulate found element quickly
    return new MockElementHandle();
  }
  async evaluate(_fn: any, _args: any) {
    // In unit tests we don't need to run the actual browser code – just record the invocation.
    this._evaluateCalls += 1;
  }
}

describe('page.utils', () => {
  describe('safeClick', () => {
    it('clicks element when selector resolves', async () => {
      const page = new MockPage() as any;
      const clicked = await safeClick(page, 'button.test');
      expect(clicked).toBe(true);
      expect(page._selector).toBe('button.test');
    });

    it('returns false when waitForSelector throws', async () => {
      const failingPage = {
        waitForSelector: () => Promise.reject(new Error('not found')),
      } as any;
      const clicked = await safeClick(failingPage, '.nope');
      expect(clicked).toBe(false);
    });
  });

  describe('autoScroll', () => {
    it('invokes page.evaluate to scroll', async () => {
      const page = new MockPage() as any;
      await autoScroll(page, 100, 10);
      expect(page._evaluateCalls).toBe(1);
    });
  });
}); 