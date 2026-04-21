import type { RecommendationItem } from "./mock-data";
import { MOCK_RECOMMENDATIONS } from "./mock-data";
import CATALOG_DATA from "./catalog-data.json";

const DISPLAYABLE_CATEGORIES = new Set([
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories",
]);

const loaded = CATALOG_DATA as unknown as RecommendationItem[];
const base = loaded.length > 0 ? loaded : MOCK_RECOMMENDATIONS;

export const CATALOG: RecommendationItem[] = base.filter(
  (item) =>
    item.productName?.trim() &&
    item.affiliateUrl?.trim() &&
    DISPLAYABLE_CATEGORIES.has(item.category)
);
