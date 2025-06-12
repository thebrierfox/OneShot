# Vendor Selector Mapping

| Vendor | Product Name Selector | Daily Price Selector | Weekly Price Selector | Monthly Price Selector | SKU Selector |
|--------|----------------------|----------------------|-----------------------|------------------------|--------------|
| Sunbelt Rentals | `h1[data-testid="pdp-title"], h1.product-title` | `div[data-testid="daily-rate"] span[data-testid="price"]` | `div[data-testid="weekly-rate"] span[data-testid="price"]` | `div[data-testid="monthly-rate"] span[data-testid="price"]` | `p[data-testid="product-sku"] span` |
| United Rentals | `h1.pdp-title, h1.product-name` | `.price-daily .amount` | `.price-weekly .amount` | `.price-monthly .amount` | `.product-sku .value` |
| Fabick Rents | `h1.product_title` | `.daily-rate b` | `.weekly-rate b` | `.monthly-rate b` | `.sku span` | 