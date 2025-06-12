"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorConfigMap = exports.allVendorConfigsArray = void 0;
const sunbelt_config_1 = require("./sunbelt.config");
const unitedrentals_config_1 = require("./unitedrentals.config");
const fabickrents_config_1 = require("./fabickrents.config");
const mikesrentals_config_1 = require("./mikesrentals.config");
const farmingtonrentalstore_config_1 = require("./farmingtonrentalstore.config");
const patriot_config_1 = require("./patriot.config");
exports.allVendorConfigsArray = [
    sunbelt_config_1.sunbeltConfig,
    unitedrentals_config_1.unitedRentalsConfig,
    fabickrents_config_1.fabickRentsConfig,
    mikesrentals_config_1.mikesRentalsConfig,
    farmingtonrentalstore_config_1.farmingtonRentalStoreConfig,
    patriot_config_1.patriotConfig,
];
exports.vendorConfigMap = {
    [sunbelt_config_1.sunbeltConfig.id]: sunbelt_config_1.sunbeltConfig,
    [unitedrentals_config_1.unitedRentalsConfig.id]: unitedrentals_config_1.unitedRentalsConfig,
    [fabickrents_config_1.fabickRentsConfig.id]: fabickrents_config_1.fabickRentsConfig,
    [mikesrentals_config_1.mikesRentalsConfig.id]: mikesrentals_config_1.mikesRentalsConfig,
    [farmingtonrentalstore_config_1.farmingtonRentalStoreConfig.id]: farmingtonrentalstore_config_1.farmingtonRentalStoreConfig,
    [patriot_config_1.patriotConfig.id]: patriot_config_1.patriotConfig,
};
exports.default = exports.vendorConfigMap;
//# sourceMappingURL=index.js.map