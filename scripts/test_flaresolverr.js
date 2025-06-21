const axios = require('axios');
(async () => {
  const url = 'https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=0350110&storeNumber=00075&startDate=2025-06-21&endDate=2025-06-22&quantity=1&delivery=false&pickup=false';
  try {
    const { data } = await axios.post('http://localhost:8191/v1', {
      cmd: 'request.get',
      url,
      maxTimeout: 60000,
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 70000 });
    console.log('Flare status:', data.status);
    console.log(Object.keys(data));
    if (data.status === 'ok') {
      console.log(data.solution.response.substring(0, 500));
    } else {
      console.error(data.message);
    }
  } catch (err) {
    console.error('FS error', err.message);
  }
})(); 