import { normalize } from '../src/utils/url.util';

describe('normalize()', () => {
  it('lowercases hostname and strips query/fragment', () => {
    const input = 'HTTPS://Example.COM/Product?id=123#section';
    const expected = 'https://example.com/Product';
    expect(normalize(input)).toBe(expected);
  });

  it('removes trailing slash (non-root)', () => {
    expect(normalize('https://foo.com/bar/')).toBe('https://foo.com/bar');
  });

  it('returns original trimmed lower-cased value if URL parse fails', () => {
    const val = 'notaurl';
    expect(normalize(val)).toBe(val.trim().toLowerCase());
  });
}); 