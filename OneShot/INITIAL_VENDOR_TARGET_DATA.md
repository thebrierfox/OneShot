{
  "fileName": "INITIAL_VENDOR_TARGET_DATA.md",
  "filePath": "/",
  "fileType": "Markdown",
  "purpose": "To provide the Cursor.AI Agent with initial research and foundational data for generating vendor-specific configuration files (`packages/scraper/src/configs/[vendorId].config.ts`) and for embedding these instructions directly into those files during the project's Phase 0 scaffolding.",
  "content": [
    {
      "type": "heading",
      "level": 1,
      "text": "INITIAL VENDOR TARGET DATA & CONFIGURATION BLUEPRINTS"
    },
    {
      "type": "heading",
      "level": 2,
      "text": "1. PURPOSE OF THIS DOCUMENT"
    },
    {
      "type": "paragraph",
      "text": "This document provides the initial research and foundational data for configuring web scraping targets for the Patriot Equipment Rentals – Competitor Price-Gap Tool. The information herein is intended to be used by the Cursor.AI Agent during the project generation process, specifically for:"
    },
    {
      "type": "ordered-list",
      "items": [
        "**Populating `VendorConfig` Objects:** The data for each vendor listed below (under section `3. VENDOR-SPECIFIC DATA BLUEPRINTS`) should be used to instantiate and populate the fields of the `VendorConfig` interface (defined in `@patriot-rentals/shared-types`) within its corresponding `packages/scraper/src/configs/[vendorId].config.ts` file. The AI should map the keys provided (e.g., `id`, `baseUrl`, `startUrls`) directly to the fields of the `VendorConfig` object.",
        "**Instruction Embedding (Phase 0):** During the \"Phase 0 - Scaffolding & Instruction Embedding\" step of the main project directive, the complete data block for each vendor (from its `### Vendor:` heading down to its last `notes` entry, including all sub-fields) should be extracted VERBATIM and embedded as a header comment within the respective `packages/scraper/src/configs/[vendorId].config.ts` file. This embedded block serves as the localized specification for that config file's initial content and structure."
      ]
    },
    {
      "type": "heading",
      "level": 2,
      "text": "2. GENERAL GUIDELINES FOR VENDOR CONFIGURATION (Applicable to all vendors during generation)"
    },
    {
      "type": "unordered-list",
      "items": [
        "**`productUrlDetectRegex`**: The provided regex patterns are initial educated guesses. While you (Cursor.AI Agent) should use the provided string for the `productUrlDetectRegex` field, the embedded comment for this field should also include the provided 'Rationale for human review' to guide the operator. The operator is responsible for final verification and refinement.",
        "**`startUrls`**: These URLs should be directly used. If an item notes 'Operator Action' or 'Investigate and add', include this note as a comment within the generated `startUrls` array in the code, or in the general notes for that vendor config, to alert the operator.",
        "**`useFlaresolverr`**: The boolean value provided should be used directly.",
        "**`playwrightContextOptions`**: A default User-Agent (e.g., `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36`) and viewport (e.g., `{ width: 1920, height: 1080 }`) should be included in the `playwrightContextOptions` object structure within the `VendorConfig`. If specific options are provided for a vendor, they should be used.",
        "**`selectors`**: The `selectors` field within each `VendorConfig` is CRITICAL. This document provides conceptual guidance (e.g., 'Likely a prominent heading'). Your role, Agent, is to generate the *structure* of the `selectors` object within each `[vendorId].config.ts` file, adhering to the `VendorConfig.selectors` interface definition (e.g., fields like `productName`, `priceDay`, etc.). The actual CSS selector strings for these fields MUST be generated as explicit placeholders (e.g., `productName: 'PLACEHOLDER_SELECTOR_FOR_PRODUCT_NAME'`, `priceDay: 'PLACEHOLDER_SELECTOR_FOR_PRICE_DAY'`). The embedded directive comment for the `selectors` object should include the 'Conceptual Guidance' provided in this document. The human operator is responsible for replacing these placeholders with accurate selectors.",
        "**Adherence to `VendorConfig` Type**: Ensure all generated `[vendorId].config.ts` files strictly export an object typed as `VendorConfig` from `@patriot-rentals/shared-types`."
      ]
    },
    {
      "type": "heading",
      "level": 2,
      "text": "3. VENDOR-SPECIFIC DATA BLUEPRINTS"
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "Sunbelt Rentals",
        "targetConfigFile": "packages/scraper/src/configs/sunbelt.config.ts",
        "id": "sunbelt",
        "displayName": "Sunbelt Rentals",
        "baseUrl": "https://www.sunbeltrentals.com",
        "startUrls": [
          "https://www.sunbeltrentals.com/equipment/",
          "https://www.sunbeltrentals.com/us.sitemap.en-us-equipment-rental-category-page-sitemap.xml"
        ],
        "productUrlDetectRegex": {
          "pattern": "/equipment/[\\w\\d-]+/[\\w\\d-]+/[\\d]+/?$",
          "rationaleForHumanReview": "Based on observed sitemap structures (e.g., /equipment/forklifts/forklifts-industrial/5000-lb-pneumatic-tire-forklift-diesel/0230515/). Operator must verify this regex."
        },
        "selectorsConceptualGuidance": {
          "productName": "Likely a prominent heading (e.g., H1 tag with a specific class or data attribute like data-testid=\"pdp-title\").",
          "priceDay": "Look for elements containing daily rate text, possibly within a classed div or span (e.g., div[data-testid=\"daily-rate\"] span[data-testid=\"price\"]).",
          "priceWeek": "Similar to priceDay, look for weekly rate indicators.",
          "priceMonth": "Similar to priceDay, look for 4-week/monthly rate indicators.",
          "sku": "Often found near the product title or in a specifications table/details section (e.g., p[data-testid=\"product-sku\"] span).",
          "description": "Usually within a dedicated section or tab (e.g., div[data-testid=\"product-description-full\"]).",
          "imageUrl": "The src attribute of the main product img tag."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": true,
        "notes": "Large national rental company. Sitemaps are available and crucial for discovery. Expect strong anti-bot measures. Pricing is generally available on product pages but may require careful handling of dynamic content or location settings. The sitemap URL should be verified for validity."
      }
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "United Rentals",
        "targetConfigFile": "packages/scraper/src/configs/unitedrentals.config.ts",
        "id": "unitedrentals",
        "displayName": "United Rentals",
        "baseUrl": "https://www.unitedrentals.com",
        "startUrls": [
          "https://www.unitedrentals.com/equipment-rentals/"
        ],
        "operatorActionItems": ["Investigate and add the primary equipment sitemap URL for United Rentals if available."],
        "productUrlDetectRegex": {
          "pattern": "/equipment-rentals/[\\w-]+(?:/[\\w-]+)?/[\\w\\d-]+(?:/\\d+)?/?$",
          "rationaleForHumanReview": "Generic pattern for /equipment-rentals/[category]/[subcategory?]/[product-name-or-id]/[id?]. Operator must verify this regex."
        },
        "selectorsConceptualGuidance": {
          "productName": "Typically H1 or similar prominent heading.",
          "priceDay": "Elements associated with 'daily' rates. May require location context for prices to appear.",
          "priceWeek": "Elements associated with 'weekly' rates. May require location context.",
          "priceMonth": "Elements associated with 'monthly' rates. May require location context.",
          "sku": "Product SKU or ID element.",
          "description": "Product description section.",
          "imageUrl": "Main product image tag."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": true,
        "notes": "World's largest equipment rental company. Pricing may be dynamic based on user's ZIP code set via site interaction (e.g., modal or initial redirect). Scraping might need to simulate location selection if prices aren't default or use a fixed service ZIP code. Sophisticated tech stack and anti-bot measures expected."
      }
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "Fabick Rents",
        "targetConfigFile": "packages/scraper/src/configs/fabickrents.config.ts",
        "id": "fabickrents",
        "displayName": "Fabick Rents (The Cat Rental Store)",
        "baseUrl": "https://www.fabickcat.com",
        "startUrls": [
          "https://www.fabickcat.com/rental/",
          "https://www.fabickcat.com/rental/equipment-rental/aerial-work-platforms/",
          "https://www.fabickcat.com/rental/equipment-rental/earthmoving-equipment/",
          "https://www.fabickcat.com/rental/equipment-rental/light-towers/"
        ],
        "productUrlDetectRegex": {
          "pattern": "/rental/equipment/[\\w-]+/[\\w-]+(?:/[A-Z0-9]+)?/?$",
          "rationaleForHumanReview": "Common pattern for Cat Rental Store sites, e.g., /rental/equipment/[category]/[model-name]/[optional-CAT-ID]. Operator must verify this regex."
        },
        "selectorsConceptualGuidance": {
          "productName": "Primary product name heading.",
          "priceDay": "Check if daily rates are listed or if quote is required.",
          "priceWeek": "Check if weekly rates are listed.",
          "priceMonth": "Check if monthly rates are listed.",
          "sku": "CAT Model number or SKU.",
          "description": "Product specifications or overview.",
          "imageUrl": "Product image."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": true,
        "notes": "Part of the 'Cat Rental Store' network. May share platform similarities with other Cat dealers. Pricing information might not be directly listed and often requires a quote request. If prices are consistently not listed online, this vendor cannot be fully scraped for rates and may need to be excluded or handled differently. Verify if XML sitemaps are available."
      }
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "Mike's Rentals Inc.",
        "targetConfigFile": "packages/scraper/src/configs/mikesrentals.config.ts",
        "id": "mikesrentals",
        "displayName": "Mike's Rentals Inc.",
        "baseUrl": "http://www.mikerentalsinc.com",
        "startUrls": [
          "http://www.mikerentalsinc.com/",
          "http://www.mikerentalsinc.com/rental-equipment/"
        ],
        "productUrlDetectRegex": {
          "pattern": "/(?:rental-categories|equipment|item)/[\\w-]+(?:/[\\w-]+)?/?$",
          "rationaleForHumanReview": "Educated guess for a smaller local site. Could be category-based paths or a simple product list. Operator must verify this regex by inspecting site URLs."
        },
        "selectorsConceptualGuidance": {
          "productName": "Product title element.",
          "priceDay": "Element showing daily price.",
          "priceWeek": "Element showing weekly price.",
          "priceMonth": "Element showing monthly price.",
          "sku": "Product identifier if available.",
          "description": "Description text.",
          "imageUrl": "Product image."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": false,
        "notes": "Local business in Sikeston, MO. Website is stated to have prices and availability. Expected to be a simpler site structure with less aggressive anti-bot measures compared to national chains."
      }
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "Farmington Rental Store",
        "targetConfigFile": "packages/scraper/src/configs/farmingtonrentalstore.config.ts",
        "id": "farmingtonrentalstore",
        "displayName": "Farmington Rental Store (True Value)",
        "baseUrl": "https://www.truevaluerentalfarmington.com",
        "startUrls": [
          "https://www.truevaluerentalfarmington.com/",
          "https://www.truevaluerentalfarmington.com/equipment-rentals/",
          "https://www.truevaluerentalfarmington.com/event-party-rentals/"
        ],
        "productUrlDetectRegex": {
          "pattern": "/rentals/(?:equipment|tools|event-party)/[\\w-]+(?:/[\\w-]+)?/?$",
          "rationaleForHumanReview": "As it's a True Value affiliate, it might use a common platform. Path structure like /rentals/[category]/[item-name] or /equipment/[item_id]. Operator must verify this regex."
        },
        "selectorsConceptualGuidance": {
          "productName": "Product name display.",
          "priceDay": "Daily rental rate field.",
          "priceWeek": "Weekly rental rate field.",
          "priceMonth": "Monthly rental rate field (check if '4 week' or similar).",
          "sku": "SKU or item code.",
          "description": "Item description details.",
          "imageUrl": "Link to product image."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": false,
        "notes": "Affiliated with True Value, located in Farmington, MO. May use a True Value provided rental website platform. Pricing seems to be available. Site structure expected to be simpler than national chains."
      }
    },
    { "type": "horizontal-rule" },
    {
      "type": "vendorBlueprint",
      "vendor": {
        "headingName": "Patriot Equipment Rentals (Own Site)",
        "targetConfigFile": "packages/scraper/src/configs/patriot.config.ts",
        "id": "patriot",
        "displayName": "Patriot Equipment Rentals",
        "baseUrl": "https://www.rentwithpatriot.com",
        "startUrls": [
          // Operator Action: Define primary equipment listing/catalog URL from www.rentwithpatriot.com.
          // Operator Action: Check for and add https://www.rentwithpatriot.com/sitemap.xml if it exists and is useful.
          "PLACEHOLDER_PATRIOT_START_URL_1",
          "PLACEHOLDER_PATRIOT_START_URL_2"
        ],
        "operatorActionItems": [
          "Define the primary equipment listing/catalog URL from `www.rentwithpatriot.com` and replace PLACEHOLDER_PATRIOT_START_URL_1.",
          "Check for `https://www.rentwithpatriot.com/sitemap.xml`; if useful, add it or replace PLACEHOLDER_PATRIOT_START_URL_2."
        ],
        "productUrlDetectRegex": {
          "pattern": "/equipment/(?:[\\w-]+/)?([\\w-]+)/?$",
          "rationaleForHumanReview": "Generic guess; e.g., /equipment/[category-optional]/[product-slug-or-id]. THIS MUST BE ACCURATELY DEFINED by the operator based on the actual site structure of www.rentwithpatriot.com."
        },
        "selectorsConceptualGuidance": {
          "productName": "CRITICAL: Define selector for Patriot's product name.",
          "priceDay": "CRITICAL: Define selector for Patriot's daily price.",
          "priceWeek": "CRITICAL: Define selector for Patriot's weekly price.",
          "priceMonth": "CRITICAL: Define selector for Patriot's monthly price.",
          "sku": "CRITICAL: Define selector for Patriot's SKU.",
          "description": "CRITICAL: Define selector for Patriot's product description.",
          "imageUrl": "CRITICAL: Define selector for Patriot's product image URL.",
          "category": "CRITICAL: Define selector for Patriot's product category."
        },
        "defaultPlaywrightContextOptions": true,
        "useFlaresolverr": false,
        "notes": "This is Patriot's own website. The primary goal is to accurately extract its full catalog and pricing for comparison. No anti-scraping measures are expected from this site, facilitating straightforward scraping. Selectors and product URL detection are of UTMOST IMPORTANCE and MUST be meticulously defined by the operator."
      }
    }
  ]
}