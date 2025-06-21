import { axiosProxy } from './packages/scraper/src/utils/axiosProxy';

(async () => {
  process.env.HTTP_PROXY_STRING = 'http://40IPLITTQW1N2OUIX8LBO941BM8TF5HH774FFVEHZE7X1A9WOSD6GLVH3NFZDSG3V17HJNRJ69F570X1:render_js=False&premium_proxy=True@proxy.scrapingbee.com:8886';
  const url = 'https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=08576&storeNumber=00166&startDate=2025-07-01&endDate=2025-07-02&quantity=1&delivery=false&pickup=false';
  try {
    const res = await axiosProxy({ url, method: 'GET', headers: { Accept: 'application/json' }, validateStatus: () => true });
    console.log('status', res.status);
    console.log('data', res.data);
  } catch (err: any) {
    console.error('axios error', err.message);
  }
})(); 