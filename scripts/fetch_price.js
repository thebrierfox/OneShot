const axios = require('axios');
(async () => {
  const cat = process.argv[2] || '0350110';
  const store = process.argv[3] || '00166';
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const start = fmt(today);
  const end = fmt(new Date(today.getTime() + 24 * 3600 * 1000));
  const url = `https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=${cat}&storeNumber=${store}&startDate=${start}&endDate=${end}&quantity=1&delivery=false&pickup=false`;
  try {
    const r = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('Status:', r.status);
    console.log(JSON.stringify(r.data, null, 2));
  } catch (err) {
    console.error('Request failed:', err.response?.status, err.message);
    process.exit(1);
  }
})(); 