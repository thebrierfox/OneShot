import * as dotenv from 'dotenv';
import { Connection, Client, ConnectionOptions, ClientOptions } from '@temporalio/client';

dotenv.config(); // Load environment variables from .env file

let temporalClientInstance: Client | null = null;

/**
 * Configuration options for getting the Temporal client.
 */
export interface GetTemporalClientOptions {
  temporalAddress?: string;
  temporalNamespace?: string;
  connectionOptions?: Partial<ConnectionOptions>;
  clientOptions?: Partial<ClientOptions>;
  forceNew?: boolean; // If true, forces creation of a new client instance
}

/**
 * Creates and returns a Temporal client instance.
 * It attempts to reuse an existing client instance if already created (simple singleton),
 * unless `forceNew` is true in options.
 * @param options Optional configuration for client creation.
 * @returns A Promise resolving to a Temporal Client instance.
 * @throws Error if TEMPORAL_ADDRESS or TEMPORAL_NAMESPACE environment variables are not set (and not provided in options),
 *         or if connection to Temporal fails.
 */
export async function getTemporalClient(options?: GetTemporalClientOptions): Promise<Client> {
  if (temporalClientInstance && !options?.forceNew) {
    return temporalClientInstance;
  }

  const address = options?.temporalAddress || process.env.TEMPORAL_ADDRESS;
  const namespace = options?.temporalNamespace || process.env.TEMPORAL_NAMESPACE || 'default';

  if (!address) {
    throw new Error('Temporal address is not configured. Set TEMPORAL_ADDRESS env var or provide in options.');
  }

  try {
    const connection = await Connection.connect({
      address,
      ...(options?.connectionOptions || {}),
    });
    
    const client = new Client({
      connection,
      namespace,
      ...(options?.clientOptions || {}),
    });
    
    console.info(`Successfully connected to Temporal at ${address}, namespace: ${namespace}`);
    if (!options?.forceNew) {
      temporalClientInstance = client;
    }
    return client;
  } catch (error) {
    console.error(`Failed to connect to Temporal or create client: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Temporal client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Closes the singleton Temporal client connection, if one exists.
 */
export async function closeTemporalClient(): Promise<void> {
  if (temporalClientInstance) {
    try {
      await temporalClientInstance.connection.close();
      console.info('Singleton Temporal client connection closed.');
    } catch (error) {
      console.error(`Error closing Temporal client connection: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      temporalClientInstance = null;
    }
  }
} 