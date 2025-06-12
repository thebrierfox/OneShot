import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const FLARESOLVERR_URL = 'http://localhost:8191/v1';
const ARTIFACT_DIR = path.join(process.cwd(), 'debug_artifacts');

async function getSessionFromFlareSolverr(targetUrl: string): Promise<any> {
  console.log(`Requesting session for ${targetUrl} via FlareSolverr...`);
  
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  try {
    const response = await axios.post(
      FLARESOLVERR_URL,
      {
        cmd: 'request.get',
        url: targetUrl,
        maxTimeout: 60000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status !== 'ok') {
      throw new Error(`FlareSolverr returned an error: ${response.data.message}`);
    }

    console.log('Successfully retrieved session from FlareSolverr.');
    
    const solution = response.data.solution;
    
    // Save the cookies and HTML for inspection
    await fs.writeFile(path.join(ARTIFACT_DIR, 'flaresolverr_cookies.json'), JSON.stringify(solution.cookies, null, 2));
    await fs.writeFile(path.join(ARTIFACT_DIR, 'flaresolverr_page.html'), solution.response);
    
    console.log(`Saved cookies and HTML to ${ARTIFACT_DIR}`);

    return solution;
  } catch (error: any) {
    console.error('Error communicating with FlareSolverr:', error.message);
    if (error.response) {
      console.error('FlareSolverr response:', error.response.data);
    }
    throw new Error('Failed to get session from FlareSolverr.');
  }
}

if (require.main === module) {
  (async () => {
    const targetUrl = 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/';
    try {
      await getSessionFromFlareSolverr(targetUrl);
    } catch (e) {
      console.error('Script failed.');
      process.exit(1);
    }
  })();
} 