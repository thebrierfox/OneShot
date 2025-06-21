import axios from 'axios';
import { axiosProxy } from './utils/axiosProxy';
import fs from 'fs/promises';
import path from 'path';

interface SunbeltRateArgs {
  sku: string;
  zipCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

interface SunbeltCookie {
  name: string;
  value: string;
}

export async function fetchRatesViaApi(args: SunbeltRateArgs): Promise<any> {
  console.log(`Fetching rates for SKU ${args.sku} at ZIP ${args.zipCode} via Shadow-API...`);

  // Step 1: Read the cookies from the FlareSolverr session
  const cookiePath = path.join(process.cwd(), 'debug_artifacts', 'flaresolverr_cookies.json');
  const cookies: SunbeltCookie[] = JSON.parse(await fs.readFile(cookiePath, 'utf-8'));
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Step 2: Construct the API call
  const apiUrl = `https://api.sunbeltrentals.com/v2/pdp/rates`;
  const params = {
    catClassId: args.sku.substring(0, 4),
    catId: args.sku,
    storeId: '1076',
    zipCode: args.zipCode,
    startDate: args.startDate,
    endDate: args.endDate,
    isSignalR: 'false',
    isViewNearBy: 'false'
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
    'referer': 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/',
    'origin':  'https://www.sunbeltrentals.com',
    'accept': 'application/json, text/plain, */*',
    'Cookie': cookieString,
  };

  try {
    console.log("DEBUG params about to send:", params);
    console.log(`Making request to: ${apiUrl}`);
    console.log('With params:', params);
    const response = await axiosProxy({
      url: apiUrl,
      method: 'GET',
      params,
      headers,
    });

    if (response.status !== 200) {
      throw new Error(`API returned non-200 status: ${response.status}`);
    }

    console.log('Successfully fetched rates from Shadow-API.');
    const ratesPath = path.join(process.cwd(), 'debug_artifacts', 'sunbelt_rates.json');
    await fs.writeFile(ratesPath, JSON.stringify(response.data, null, 2));
    console.log(`Saved rates to ${ratesPath}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error fetching rates from Shadow-API:', error.response?.status, error.response?.data);
    } else {
        console.error('Error fetching rates from Shadow-API:', error);
    }
    throw new Error('Failed to fetch rates via Shadow-API replay.');
  }
}

if (require.main === module) {
    (async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const testArgs: SunbeltRateArgs = {
        sku: '0350110',
        zipCode: '63841', // Dexter, MO
        startDate: formatDate(today),
        endDate: formatDate(tomorrow)
      };
      try {
        await fetchRatesViaApi(testArgs);
      } catch (e) {
        console.error('API replay script failed.');
        process.exit(1);
      }
    })();
} 