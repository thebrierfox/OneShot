import axios, { AxiosResponse } from 'axios';

/**
 * Represents the structure of a cookie object from FlareSolverr.
 */
interface FlareSolverrCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Represents the structure of the solution part of a FlareSolverr response.
 */
export interface FlareSolverrSolution {
  url: string;
  status: number;
  headers: Record<string, string>; // Simplified, adjust if more specific header structure is needed
  response: string;
  cookies: FlareSolverrCookie[];
  userAgent: string;
}

/**
 * Represents the full structure of a FlareSolverr v1 response.
 */
export interface FlareSolverrResponse {
  solution: FlareSolverrSolution;
  message: string;
  status: string; // e.g., 'ok' or 'error'
  startTimestamp: number;
  endTimestamp: number;
  version: string;
}

/**
 * Solves a challenge for a given URL using FlareSolverr.
 * @param targetUrl The URL to solve.
 * @returns A Promise resolving to the FlareSolverr response.
 * @throws Error if FLARESOLVERR_URL is not set or if the request fails.
 */
export async function solveWithFlareSolverr(
  targetUrl: string,
): Promise<FlareSolverrResponse> {
  const flareSolverrUrl = process.env.FLARESOLVERR_URL;

  if (!flareSolverrUrl) {
    throw new Error('FLARESOLVERR_URL environment variable is not set.');
  }

  try {
    const response: AxiosResponse<FlareSolverrResponse> = await axios.post(
      flareSolverrUrl, // This should be the base URL ending in /v1, e.g., http://localhost:8191/v1
      {
        cmd: 'request.get',
        url: targetUrl,
        maxTimeout: 60000, // 60 seconds timeout
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data && response.data.status === 'ok') {
      return response.data;
    }
    throw new Error(
      `FlareSolverr request failed with status ${response.status} or error message: ${response.data?.message}`,
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Axios error calling FlareSolverr for URL ${targetUrl}: ${error.message} - ${error.response?.data?.message}`,
      );
    }
    throw new Error(
      `Unexpected error calling FlareSolverr for URL ${targetUrl}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
} 