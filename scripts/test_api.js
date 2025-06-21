const axios = require('axios');
(async () => {
  const today = new Date();
  const fmt = d=>d.toISOString().split('T')[0];
  const start = fmt(today);
  const end = fmt(new Date(today.getTime()+24*3600*1000));
  const v3 = `https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=0350110&storeNumber=00075&startDate=${start}&endDate=${end}&quantity=1&delivery=false&pickup=false`;
  try {
    const {data, status} = await axios.get(v3, {
      headers:{'User-Agent':'Mozilla/5.0'},
      timeout: 10000,
      validateStatus:()=>true,
    });
    console.log('v3 status', status);
    console.log(data);
  } catch(err){console.error('v3 error', err.message);}  

  const v2Url = 'https://api.sunbeltrentals.com/v2/pdp/rates';
  const params = {
    catClassId:'0350',
    catId:'0350110',
    storeId:'1076',
    zipCode:'63701',
    startDate:start,
    endDate:end,
    isSignalR:'false',
    isViewNearBy:'false'
  };
  try {
    const {data, status} = await axios.get(v2Url,{params, headers:{'User-Agent':'Mozilla/5.0','x-requested-with':'XMLHttpRequest','referer':'https://www.sunbeltrentals.com','origin':'https://www.sunbeltrentals.com','accept':'application/json'}, timeout:10000, validateStatus:()=>true});
    console.log('v2 status', status);
    console.log(data);
  } catch(err){console.error('v2 error', err.message);}  
})(); 