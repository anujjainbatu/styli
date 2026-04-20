import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Demo user — linked to a placeholder supabaseId.
  // Replace with a real Supabase user ID after signing up.
  const user = await prisma.user.upsert({
    where: { email: "demo@styli.app" },
    update: {},
    create: {
      supabaseId: "00000000-0000-0000-0000-000000000001",
      email: "demo@styli.app",
      displayName: "Priya Sharma",
      scanCompleted: true,
    },
  })

  await prisma.stylePreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      genderIdentity: "female",
      heightCm: 165,
      preferredStyles: ["Minimalist", "Classic", "Bohemian"],
      budgetTier: "mid",
      budgetMinUsd: 50,
      budgetMaxUsd: 150,
    },
  })

  await prisma.bodyProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      bodyShape: "hourglass",
      bodyShapeConfidence: 0.88,
      faceShape: "oval",
      faceShapeConfidence: 0.92,
      monkTone: 5,
      skinUndertone: "warm",
      colorSeason: "warm_autumn",
      skinToneConfirmed: true,
      recommendedSilhouettes: ["A-line", "Wrap", "Fit-and-flare", "Belted"],
      recommendedNecklines: ["V-neck", "Scoop", "Sweetheart"],
      colorPalette: ["#8B4513", "#D2691E", "#CD853F", "#A0522D", "#6B4226", "#C17F24", "#B5651D", "#8B6914"],
      avoidColors: ["#87CEEB", "#ADD8E6", "#90EE90"],
    },
  })

  const wardrobeData = [
    { productName: "White Linen Shirt", brand: "Everlane", category: "Tops", primaryColor: "white", primaryColorHex: "#FFFFFF", wearCount: 12, isFavorite: true, price: 68, formalityLevel: 2, source: "url" },
    { productName: "Black High-Rise Jeans", brand: "Agolde", category: "Bottoms", primaryColor: "black", primaryColorHex: "#1A1A1A", wearCount: 18, isFavorite: true, price: 198, formalityLevel: 2, source: "url" },
    { productName: "Camel Wool Blazer", brand: "Theory", category: "Outerwear", primaryColor: "camel", primaryColorHex: "#C19A6B", wearCount: 5, isFavorite: false, price: 345, formalityLevel: 4, source: "manual" },
    { productName: "Silk Midi Slip Dress", brand: "& Other Stories", category: "Dresses", primaryColor: "champagne", primaryColorHex: "#F7E7CE", wearCount: 3, isFavorite: true, price: 125, formalityLevel: 3, source: "url" },
    { productName: "White Leather Sneakers", brand: "Common Projects", category: "Shoes", primaryColor: "white", primaryColorHex: "#FFFFF0", wearCount: 22, isFavorite: true, price: 450, formalityLevel: 1, source: "url" },
    { productName: "Navy Striped Tee", brand: "J.Crew", category: "Tops", primaryColor: "navy", primaryColorHex: "#1B2A4A", wearCount: 8, isFavorite: false, price: 45, formalityLevel: 1, source: "manual" },
    { productName: "Cream Wide-Leg Trousers", brand: "Cos", category: "Bottoms", primaryColor: "cream", primaryColorHex: "#FFFDD0", wearCount: 4, isFavorite: false, price: 89, formalityLevel: 3, source: "url" },
    { productName: "Black Leather Belt", brand: "A.P.C.", category: "Accessories", primaryColor: "black", primaryColorHex: "#1A1A1A", wearCount: 15, isFavorite: false, price: 95, formalityLevel: 3, source: "manual" },
    { productName: "Rust Knit Cardigan", brand: "Mango", category: "Outerwear", primaryColor: "rust", primaryColorHex: "#8B4513", wearCount: 6, isFavorite: true, price: 79, formalityLevel: 2, source: "url" },
    { productName: "Black Leather Tote", brand: "Mansur Gavriel", category: "Bags", primaryColor: "black", primaryColorHex: "#1A1A1A", wearCount: 25, isFavorite: true, price: 495, formalityLevel: 3, source: "url" },
    { productName: "Tan Ankle Boots", brand: "Sam Edelman", category: "Shoes", primaryColor: "tan", primaryColorHex: "#D2B48C", wearCount: 14, isFavorite: true, price: 120, formalityLevel: 2, source: "url" },
    { productName: "Floral Wrap Blouse", brand: "Reformation", category: "Tops", primaryColor: "multicolor", primaryColorHex: "#E8D5B7", wearCount: 2, isFavorite: false, price: 148, formalityLevel: 3, source: "image" },
    { productName: "Dark Wash Straight Jeans", brand: "Levi's", category: "Bottoms", primaryColor: "indigo", primaryColorHex: "#4B0082", wearCount: 10, isFavorite: false, price: 98, formalityLevel: 2, source: "url" },
    { productName: "Gold Hoop Earrings", brand: "Mejuri", category: "Accessories", primaryColor: "gold", primaryColorHex: "#C8A96E", wearCount: 30, isFavorite: true, price: 68, formalityLevel: 2, source: "manual" },
    { productName: "Olive Utility Jacket", brand: "Zara", category: "Outerwear", primaryColor: "olive", primaryColorHex: "#6B7C3B", wearCount: 7, isFavorite: false, price: 89, formalityLevel: 1, source: "url" },
  ]

  for (const item of wardrobeData) {
    await prisma.wardrobeItem.create({ data: { userId: user.id, ...item } })
  }

  console.log(`Seeded ${wardrobeData.length} wardrobe items`)
  console.log("Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
