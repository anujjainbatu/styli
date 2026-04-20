export const MOCK_USER = {
  id: "usr_01",
  name: "Priya Sharma",
  email: "priya@example.com",
  avatarUrl: null,
  scanCompleted: true,
  bodyShape: "hourglass",
  faceShape: "oval",
  monkTone: 5,
  skinUndertone: "warm" as const,
  colorSeason: "warm_autumn",
  height_cm: 165,
  styleProfile: {
    recommendedSilhouettes: ["A-line", "Wrap", "Fit-and-flare", "Belted"],
    recommendedNecklines: ["V-neck", "Scoop", "Sweetheart"],
    colorPalette: ["#8B4513", "#D2691E", "#A0522D", "#556B2F", "#8FBC8F", "#DAA520", "#CD853F", "#BC8F5F"],
    avoidColors: ["#FF4500", "#FF6347", "#DC143C"],
  },
};

export const MONK_TONES = [
  { tone: 1, hex: "#F6EDE4", label: "Monk 1" },
  { tone: 2, hex: "#F3E7DB", label: "Monk 2" },
  { tone: 3, hex: "#F7EAD0", label: "Monk 3" },
  { tone: 4, hex: "#EAD9C8", label: "Monk 4" },
  { tone: 5, hex: "#D7B899", label: "Monk 5" },
  { tone: 6, hex: "#C68642", label: "Monk 6" },
  { tone: 7, hex: "#A0522D", label: "Monk 7" },
  { tone: 8, hex: "#6B3A2A", label: "Monk 8" },
  { tone: 9, hex: "#4A2313", label: "Monk 9" },
  { tone: 10, hex: "#2D1B0E", label: "Monk 10" },
];

export const SEASON_PALETTES: Record<string, { label: string; colors: string[] }> = {
  warm_autumn: {
    label: "Warm Autumn",
    colors: ["#8B4513", "#D2691E", "#A0522D", "#556B2F", "#8FBC8F", "#DAA520", "#CD853F", "#BC8F5F"],
  },
  deep_winter: {
    label: "Deep Winter",
    colors: ["#0D0D0D", "#1C1C6E", "#8B0000", "#006400", "#4B0082", "#2F4F4F", "#191970", "#8B008B"],
  },
  bright_spring: {
    label: "Bright Spring",
    colors: ["#FF6B6B", "#FFD700", "#00CED1", "#32CD32", "#FF69B4", "#1E90FF", "#FF8C00", "#7CFC00"],
  },
  cool_summer: {
    label: "Cool Summer",
    colors: ["#B0C4DE", "#87CEEB", "#DDA0DD", "#F08080", "#20B2AA", "#778899", "#C0C0C0", "#708090"],
  },
};

export type RecommendationItem = {
  id: string;
  productName: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
  matchScore: number;
  explanations: Array<{ icon: string; text: string }>;
  pairsWithCount: number;
  inWishlist: boolean;
  affiliateUrl: string;
  primaryColor: string;
  primaryColorHex: string;
};

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "rec_01",
    productName: "Rust Wrap Midi Dress",
    brand: "& Other Stories",
    price: 135,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80",
    category: "Dresses",
    matchScore: 0.94,
    explanations: [
      { icon: "🎨", text: "Your Warm Autumn palette" },
      { icon: "✦", text: "Wrap silhouette for hourglass" },
      { icon: "💫", text: "Pairs with 3 items you own" },
    ],
    pairsWithCount: 3,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "rust",
    primaryColorHex: "#8B4513",
  },
  {
    id: "rec_02",
    productName: "Forest Green Blazer",
    brand: "Massimo Dutti",
    price: 220,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
    category: "Outerwear",
    matchScore: 0.91,
    explanations: [
      { icon: "🎨", text: "Deep green matches your season" },
      { icon: "⬡", text: "Strong shoulders balance hips" },
    ],
    pairsWithCount: 5,
    inWishlist: true,
    affiliateUrl: "#",
    primaryColor: "forest green",
    primaryColorHex: "#228B22",
  },
  {
    id: "rec_03",
    productName: "Camel High-Waist Trousers",
    brand: "Arket",
    price: 89,
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b4f6a?w=400&q=80",
    category: "Bottoms",
    matchScore: 0.89,
    explanations: [
      { icon: "🎨", text: "Camel is core to your palette" },
      { icon: "✦", text: "High-waist elongates silhouette" },
      { icon: "💫", text: "Pairs with 4 items you own" },
    ],
    pairsWithCount: 4,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "camel",
    primaryColorHex: "#C19A6B",
  },
  {
    id: "rec_04",
    productName: "Ivory V-Neck Silk Blouse",
    brand: "COS",
    price: 95,
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80",
    category: "Tops",
    matchScore: 0.87,
    explanations: [
      { icon: "◇", text: "V-neck flatters oval face" },
      { icon: "✦", text: "Neutral anchor for outfits" },
    ],
    pairsWithCount: 7,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "ivory",
    primaryColorHex: "#FFFFF0",
  },
  {
    id: "rec_05",
    productName: "Terracotta A-Line Skirt",
    brand: "Sézane",
    price: 115,
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80",
    category: "Bottoms",
    matchScore: 0.86,
    explanations: [
      { icon: "🎨", text: "Terracotta in your palette" },
      { icon: "✦", text: "A-line balances proportions" },
    ],
    pairsWithCount: 2,
    inWishlist: true,
    affiliateUrl: "#",
    primaryColor: "terracotta",
    primaryColorHex: "#C26539",
  },
  {
    id: "rec_06",
    productName: "Cognac Leather Belt",
    brand: "Toteme",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    category: "Accessories",
    matchScore: 0.85,
    explanations: [
      { icon: "✦", text: "Define your waist" },
      { icon: "🎨", text: "Warm cognac tone" },
    ],
    pairsWithCount: 9,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "cognac",
    primaryColorHex: "#9B4400",
  },
  {
    id: "rec_07",
    productName: "Olive Wide-Leg Jeans",
    brand: "Agolde",
    price: 198,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
    category: "Bottoms",
    matchScore: 0.83,
    explanations: [
      { icon: "🎨", text: "Olive aligns with Warm Autumn" },
      { icon: "💫", text: "Pairs with 3 items you own" },
    ],
    pairsWithCount: 3,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "olive",
    primaryColorHex: "#556B2F",
  },
  {
    id: "rec_08",
    productName: "Burgundy Knit Turtleneck",
    brand: "Vince",
    price: 175,
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
    category: "Tops",
    matchScore: 0.82,
    explanations: [
      { icon: "🎨", text: "Rich burgundy for your depth" },
      { icon: "✦", text: "Cozy seasonal staple" },
    ],
    pairsWithCount: 4,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "burgundy",
    primaryColorHex: "#722F37",
  },
  {
    id: "rec_09",
    productName: "Tan Suede Chelsea Boots",
    brand: "Sam Edelman",
    price: 130,
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
    category: "Shoes",
    matchScore: 0.81,
    explanations: [
      { icon: "🎨", text: "Warm tan grounds any look" },
      { icon: "💫", text: "Pairs with 6 items you own" },
    ],
    pairsWithCount: 6,
    inWishlist: true,
    affiliateUrl: "#",
    primaryColor: "tan",
    primaryColorHex: "#D2B48C",
  },
  {
    id: "rec_10",
    productName: "Moss Green Trench Coat",
    brand: "Reiss",
    price: 365,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80",
    category: "Outerwear",
    matchScore: 0.79,
    explanations: [
      { icon: "🎨", text: "Moss green suits warm tones" },
      { icon: "✦", text: "Belted waist for definition" },
    ],
    pairsWithCount: 5,
    inWishlist: false,
    affiliateUrl: "#",
    primaryColor: "moss green",
    primaryColorHex: "#8A9A5B",
  },
];

export type WardrobeItem = {
  id: string;
  productName: string;
  brand?: string | null;
  category: string;
  primaryColor?: string | null;
  primaryColorHex?: string | null;
  imageUrl?: string | null;
  wearCount: number;
  lastWornAt?: string | null;
  isFavorite: boolean;
  price?: number | null;
  formalityLevel?: number | null;
  source: string;
};

export const MOCK_WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: "w_01", productName: "White Linen Shirt", brand: "Everlane", category: "Tops",
    primaryColor: "white", primaryColorHex: "#FFFFFF",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    wearCount: 12, lastWornAt: "2026-04-15", isFavorite: true, price: 68, formalityLevel: 2, source: "url",
  },
  {
    id: "w_02", productName: "Black Straight Jeans", brand: "Mango", category: "Bottoms",
    primaryColor: "black", primaryColorHex: "#1A1A1A",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    wearCount: 18, lastWornAt: "2026-04-18", isFavorite: true, price: 55, formalityLevel: 2, source: "manual",
  },
  {
    id: "w_03", productName: "Camel Wool Coat", brand: "Zara", category: "Outerwear",
    primaryColor: "camel", primaryColorHex: "#C19A6B",
    imageUrl: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&q=80",
    wearCount: 6, lastWornAt: "2026-04-10", isFavorite: true, price: 129, formalityLevel: 3, source: "url",
  },
  {
    id: "w_04", productName: "Navy Midi Dress", brand: "& Other Stories", category: "Dresses",
    primaryColor: "navy", primaryColorHex: "#003153",
    imageUrl: "https://images.unsplash.com/photo-1562572159-4efd90232a99?w=400&q=80",
    wearCount: 4, lastWornAt: "2026-03-28", isFavorite: false, price: 110, formalityLevel: 3, source: "url",
  },
  {
    id: "w_05", productName: "Tan Ankle Boots", brand: "Steve Madden", category: "Shoes",
    primaryColor: "tan", primaryColorHex: "#D2B48C",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
    wearCount: 15, lastWornAt: "2026-04-17", isFavorite: true, price: 89, formalityLevel: 2, source: "manual",
  },
  {
    id: "w_06", productName: "Cream Knit Sweater", brand: "H&M", category: "Tops",
    primaryColor: "cream", primaryColorHex: "#FAF8F2",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
    wearCount: 9, lastWornAt: "2026-04-12", isFavorite: false, price: 35, formalityLevel: 2, source: "image",
  },
  {
    id: "w_07", productName: "Olive Cargo Pants", brand: "ASOS", category: "Bottoms",
    primaryColor: "olive", primaryColorHex: "#556B2F",
    imageUrl: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=400&q=80",
    wearCount: 3, lastWornAt: "2026-04-05", isFavorite: false, price: 45, formalityLevel: 1, source: "manual",
  },
  {
    id: "w_08", productName: "Gold Hoop Earrings", brand: "Mejuri", category: "Accessories",
    primaryColor: "gold", primaryColorHex: "#C8A96E",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
    wearCount: 22, lastWornAt: "2026-04-20", isFavorite: true, price: 68, formalityLevel: 2, source: "manual",
  },
  {
    id: "w_09", productName: "Brown Leather Tote", brand: "Madewell", category: "Bags",
    primaryColor: "brown", primaryColorHex: "#795548",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    wearCount: 11, lastWornAt: "2026-04-19", isFavorite: true, price: 148, formalityLevel: 3, source: "url",
  },
  {
    id: "w_10", productName: "Rust Turtleneck", brand: "Uniqlo", category: "Tops",
    primaryColor: "rust", primaryColorHex: "#B7410E",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    wearCount: 7, lastWornAt: "2026-04-08", isFavorite: false, price: 39, formalityLevel: 2, source: "manual",
  },
  {
    id: "w_11", productName: "White Sneakers", brand: "Common Projects", category: "Shoes",
    primaryColor: "white", primaryColorHex: "#FFFFFF",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    wearCount: 20, lastWornAt: "2026-04-20", isFavorite: true, price: 375, formalityLevel: 1, source: "url",
  },
  {
    id: "w_12", productName: "Terracotta Linen Blazer", brand: "Club Monaco", category: "Outerwear",
    primaryColor: "terracotta", primaryColorHex: "#C26539",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
    wearCount: 2, lastWornAt: "2026-03-15", isFavorite: false, price: 195, formalityLevel: 4, source: "url",
  },
  {
    id: "w_13", productName: "Dark Wash Bootcut Jeans", brand: "AG Jeans", category: "Bottoms",
    primaryColor: "indigo", primaryColorHex: "#4B0082",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    wearCount: 8, lastWornAt: "2026-04-14", isFavorite: false, price: 178, formalityLevel: 2, source: "url",
  },
  {
    id: "w_14", productName: "Silk Slip Dress", brand: "Reformation", category: "Dresses",
    primaryColor: "champagne", primaryColorHex: "#FAD5A5",
    imageUrl: "https://images.unsplash.com/photo-1562572159-4efd90232a99?w=400&q=80",
    wearCount: 1, lastWornAt: "2026-02-14", isFavorite: true, price: 218, formalityLevel: 4, source: "url",
  },
  {
    id: "w_15", productName: "Patterned Silk Scarf", brand: "Zara", category: "Accessories",
    primaryColor: "multi", primaryColorHex: "#8B4513",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    wearCount: 5, lastWornAt: "2026-04-11", isFavorite: false, price: 25, formalityLevel: 2, source: "image",
  },
];

export const MOCK_WISHLIST_ITEMS = MOCK_RECOMMENDATIONS.filter((r) => r.inWishlist).map((r) => ({
  ...r,
  savedAt: "2026-04-10",
}));

export const STYLE_OPTIONS = [
  { id: "minimalist", label: "Minimalist", icon: "◻" },
  { id: "classic", label: "Classic", icon: "◆" },
  { id: "bohemian", label: "Bohemian", icon: "⬡" },
  { id: "streetwear", label: "Streetwear", icon: "◉" },
  { id: "romantic", label: "Romantic", icon: "✦" },
  { id: "preppy", label: "Preppy", icon: "▲" },
  { id: "edgy", label: "Edgy", icon: "◈" },
  { id: "sporty", label: "Sporty", icon: "◫" },
  { id: "business", label: "Business", icon: "▣" },
  { id: "cottage_core", label: "Cottage Core", icon: "❋" },
];

export const GENDER_OPTIONS = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "non_binary", label: "Non-binary" },
  { id: "prefer_not", label: "Prefer not to say" },
];

export const BUDGET_TIERS = [
  { id: "budget", label: "Budget", range: "Under $50", min: 0, max: 50 },
  { id: "mid", label: "Mid", range: "$50–$150", min: 50, max: 150 },
  { id: "premium", label: "Premium", range: "$150–$400", min: 150, max: 400 },
  { id: "luxury", label: "Luxury", range: "$400+", min: 400, max: 2000 },
];

export const WARDROBE_CATEGORIES = [
  "All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags"
] as const;
