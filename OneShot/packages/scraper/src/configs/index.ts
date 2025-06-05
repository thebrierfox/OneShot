import type { VendorConfig } from '@patriot-rentals/shared-types';
import { sunbeltConfig } from './sunbelt.config';
import { unitedRentalsConfig } from './unitedrentals.config';
import { fabickRentsConfig } from './fabickrents.config';
import { mikesRentalsConfig } from './mikesrentals.config';
import { farmingtonRentalStoreConfig } from './farmingtonrentalstore.config';
import { patriotConfig } from './patriot.config';

export const allVendorConfigsArray: VendorConfig[] = [
  sunbeltConfig,
  unitedRentalsConfig,
  fabickRentsConfig,
  mikesRentalsConfig,
  farmingtonRentalStoreConfig,
  patriotConfig,
];

export const vendorConfigMap: Record<string, VendorConfig> = {
  [sunbeltConfig.id]: sunbeltConfig,
  [unitedRentalsConfig.id]: unitedRentalsConfig,
  [fabickRentsConfig.id]: fabickRentsConfig,
  [mikesRentalsConfig.id]: mikesRentalsConfig,
  [farmingtonRentalStoreConfig.id]: farmingtonRentalStoreConfig,
  [patriotConfig.id]: patriotConfig,
};

export default vendorConfigMap; 