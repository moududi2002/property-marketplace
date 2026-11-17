// 📍 /apps/api/prisma/seed.ts
//
// Idempotent seed. Safe to run multiple times.
// Creates:
//   1. Super admin user
//   2. Property categories (parent + children)
//   3. Bangladesh divisions (8) + districts (64)
//   4. Default website settings

import { PrismaClient, LocationType, UserRole, UserStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════
//  1. ADMIN
// ═══════════════════════════════════════════════════════════

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email },
    update: {
      // Don't overwrite password on re-runs (admin may have changed it)
      name,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log(`✅ Admin user ready: ${email} / ${password}`);
}

// ═══════════════════════════════════════════════════════════
//  2. CATEGORIES
// ═══════════════════════════════════════════════════════════

interface CategorySeed {
  slug: string;
  nameEn: string;
  nameBn: string;
  iconKey?: string;
  children?: Omit<CategorySeed, "children">[];
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: "residential",
    nameEn: "Residential",
    nameBn: "আবাসিক",
    iconKey: "home",
    children: [
      { slug: "apartment", nameEn: "Apartment", nameBn: "অ্যাপার্টমেন্ট" },
      { slug: "flat", nameEn: "Flat", nameBn: "ফ্ল্যাট" },
      { slug: "house", nameEn: "House", nameBn: "বাড়ি" },
      { slug: "duplex", nameEn: "Duplex", nameBn: "ডুপ্লেক্স" },
    ],
  },
  {
    slug: "land",
    nameEn: "Land & Plot",
    nameBn: "জমি ও প্লট",
    iconKey: "map",
    children: [
      { slug: "residential-land", nameEn: "Residential Land", nameBn: "আবাসিক জমি" },
      { slug: "commercial-land", nameEn: "Commercial Land", nameBn: "বাণিজ্যিক জমি" },
      { slug: "agricultural-land", nameEn: "Agricultural Land", nameBn: "কৃষি জমি" },
      { slug: "plot", nameEn: "Plot", nameBn: "প্লট" },
    ],
  },
  {
    slug: "commercial",
    nameEn: "Commercial",
    nameBn: "বাণিজ্যিক",
    iconKey: "briefcase",
    children: [
      { slug: "office", nameEn: "Office", nameBn: "অফিস" },
      { slug: "shop", nameEn: "Shop", nameBn: "দোকান" },
      { slug: "showroom", nameEn: "Showroom", nameBn: "শোরুম" },
      { slug: "warehouse", nameEn: "Warehouse", nameBn: "গুদাম" },
    ],
  },
  {
    slug: "building",
    nameEn: "Building",
    nameBn: "বিল্ডিং",
    iconKey: "building",
    children: [
      { slug: "residential-building", nameEn: "Residential Building", nameBn: "আবাসিক বিল্ডিং" },
      { slug: "commercial-building", nameEn: "Commercial Building", nameBn: "বাণিজ্যিক বিল্ডিং" },
      { slug: "mixed-building", nameEn: "Mixed Building", nameBn: "মিশ্র বিল্ডিং" },
    ],
  },
];

async function seedCategories(): Promise<void> {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const parent = CATEGORIES[i];
    if (!parent) continue;

    const parentRow = await prisma.propertyCategory.upsert({
      where: { slug: parent.slug },
      update: { nameEn: parent.nameEn, nameBn: parent.nameBn, iconKey: parent.iconKey, sortOrder: i },
      create: {
        slug: parent.slug,
        nameEn: parent.nameEn,
        nameBn: parent.nameBn,
        iconKey: parent.iconKey,
        sortOrder: i,
      },
    });

    for (let j = 0; j < (parent.children?.length ?? 0); j++) {
      const child = parent.children![j];
      if (!child) continue;

      await prisma.propertyCategory.upsert({
        where: { slug: child.slug },
        update: { nameEn: child.nameEn, nameBn: child.nameBn, sortOrder: j, parentId: parentRow.id },
        create: {
          slug: child.slug,
          nameEn: child.nameEn,
          nameBn: child.nameBn,
          sortOrder: j,
          parentId: parentRow.id,
        },
      });
    }
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded with children`);
}

// ═══════════════════════════════════════════════════════════
//  3. LOCATIONS (Bangladesh)
// ═══════════════════════════════════════════════════════════

interface DivisionSeed {
  slug: string;
  nameEn: string;
  nameBn: string;
  districts: { slug: string; nameEn: string; nameBn: string }[];
}

const DIVISIONS: DivisionSeed[] = [
  {
    slug: "dhaka",
    nameEn: "Dhaka",
    nameBn: "ঢাকা",
    districts: [
      { slug: "dhaka", nameEn: "Dhaka", nameBn: "ঢাকা" },
      { slug: "gazipur", nameEn: "Gazipur", nameBn: "গাজীপুর" },
      { slug: "kishoreganj", nameEn: "Kishoreganj", nameBn: "কিশোরগঞ্জ" },
      { slug: "manikganj", nameEn: "Manikganj", nameBn: "মানিকগঞ্জ" },
      { slug: "munshiganj", nameEn: "Munshiganj", nameBn: "মুন্সিগঞ্জ" },
      { slug: "narayanganj", nameEn: "Narayanganj", nameBn: "নারায়ণগঞ্জ" },
      { slug: "narsingdi", nameEn: "Narsingdi", nameBn: "নরসিংদী" },
      { slug: "tangail", nameEn: "Tangail", nameBn: "টাঙ্গাইল" },
      { slug: "faridpur", nameEn: "Faridpur", nameBn: "ফরিদপুর" },
      { slug: "gopalganj", nameEn: "Gopalganj", nameBn: "গোপালগঞ্জ" },
      { slug: "madaripur", nameEn: "Madaripur", nameBn: "মাদারীপুর" },
      { slug: "rajbari", nameEn: "Rajbari", nameBn: "রাজবাড়ী" },
      { slug: "shariatpur", nameEn: "Shariatpur", nameBn: "শরীয়তপুর" },
    ],
  },
  {
    slug: "chattogram",
    nameEn: "Chattogram",
    nameBn: "চট্টগ্রাম",
    districts: [
      { slug: "chattogram", nameEn: "Chattogram", nameBn: "চট্টগ্রাম" },
      { slug: "coxs-bazar", nameEn: "Cox's Bazar", nameBn: "কক্সবাজার" },
      { slug: "cumilla", nameEn: "Cumilla", nameBn: "কুমিল্লা" },
      { slug: "brahmanbaria", nameEn: "Brahmanbaria", nameBn: "ব্রাহ্মণবাড়িয়া" },
      { slug: "chandpur", nameEn: "Chandpur", nameBn: "চাঁদপুর" },
      { slug: "feni", nameEn: "Feni", nameBn: "ফেনী" },
      { slug: "noakhali", nameEn: "Noakhali", nameBn: "নোয়াখালী" },
      { slug: "lakshmipur", nameEn: "Lakshmipur", nameBn: "লক্ষ্মীপুর" },
      { slug: "khagrachhari", nameEn: "Khagrachhari", nameBn: "খাগড়াছড়ি" },
      { slug: "rangamati", nameEn: "Rangamati", nameBn: "রাঙ্গামাটি" },
      { slug: "bandarban", nameEn: "Bandarban", nameBn: "বান্দরবান" },
    ],
  },
  {
    slug: "rajshahi",
    nameEn: "Rajshahi",
    nameBn: "রাজশাহী",
    districts: [
      { slug: "rajshahi", nameEn: "Rajshahi", nameBn: "রাজশাহী" },
      { slug: "bogura", nameEn: "Bogura", nameBn: "বগুড়া" },
      { slug: "joypurhat", nameEn: "Joypurhat", nameBn: "জয়পুরহাট" },
      { slug: "naogaon", nameEn: "Naogaon", nameBn: "নওগাঁ" },
      { slug: "natore", nameEn: "Natore", nameBn: "নাটোর" },
      { slug: "chapainawabganj", nameEn: "Chapainawabganj", nameBn: "চাঁপাইনবাবগঞ্জ" },
      { slug: "pabna", nameEn: "Pabna", nameBn: "পাবনা" },
      { slug: "sirajganj", nameEn: "Sirajganj", nameBn: "সিরাজগঞ্জ" },
    ],
  },
  {
    slug: "khulna",
    nameEn: "Khulna",
    nameBn: "খুলনা",
    districts: [
      { slug: "khulna", nameEn: "Khulna", nameBn: "খুলনা" },
      { slug: "bagerhat", nameEn: "Bagerhat", nameBn: "বাগেরহাট" },
      { slug: "chuadanga", nameEn: "Chuadanga", nameBn: "চুয়াডাঙ্গা" },
      { slug: "jashore", nameEn: "Jashore", nameBn: "যশোর" },
      { slug: "jhenaidah", nameEn: "Jhenaidah", nameBn: "ঝিনাইদহ" },
      { slug: "kushtia", nameEn: "Kushtia", nameBn: "কুষ্টিয়া" },
      { slug: "magura", nameEn: "Magura", nameBn: "মাগুরা" },
      { slug: "meherpur", nameEn: "Meherpur", nameBn: "মেহেরপুর" },
      { slug: "narail", nameEn: "Narail", nameBn: "নড়াইল" },
      { slug: "satkhira", nameEn: "Satkhira", nameBn: "সাতক্ষীরা" },
    ],
  },
  {
    slug: "barishal",
    nameEn: "Barishal",
    nameBn: "বরিশাল",
    districts: [
      { slug: "barishal", nameEn: "Barishal", nameBn: "বরিশাল" },
      { slug: "barguna", nameEn: "Barguna", nameBn: "বরগুনা" },
      { slug: "bhola", nameEn: "Bhola", nameBn: "ভোলা" },
      { slug: "jhalokati", nameEn: "Jhalokati", nameBn: "ঝালকাঠি" },
      { slug: "patuakhali", nameEn: "Patuakhali", nameBn: "পটুয়াখালী" },
      { slug: "pirojpur", nameEn: "Pirojpur", nameBn: "পিরোজপুর" },
    ],
  },
  {
    slug: "sylhet",
    nameEn: "Sylhet",
    nameBn: "সিলেট",
    districts: [
      { slug: "sylhet", nameEn: "Sylhet", nameBn: "সিলেট" },
      { slug: "habiganj", nameEn: "Habiganj", nameBn: "হবিগঞ্জ" },
      { slug: "moulvibazar", nameEn: "Moulvibazar", nameBn: "মৌলভীবাজার" },
      { slug: "sunamganj", nameEn: "Sunamganj", nameBn: "সুনামগঞ্জ" },
    ],
  },
  {
    slug: "rangpur",
    nameEn: "Rangpur",
    nameBn: "রংপুর",
    districts: [
      { slug: "rangpur", nameEn: "Rangpur", nameBn: "রংপুর" },
      { slug: "dinajpur", nameEn: "Dinajpur", nameBn: "দিনাজপুর" },
      { slug: "gaibandha", nameEn: "Gaibandha", nameBn: "গাইবান্ধা" },
      { slug: "kurigram", nameEn: "Kurigram", nameBn: "কুড়িগ্রাম" },
      { slug: "lalmonirhat", nameEn: "Lalmonirhat", nameBn: "লালমনিরহাট" },
      { slug: "nilphamari", nameEn: "Nilphamari", nameBn: "নীলফামারী" },
      { slug: "panchagarh", nameEn: "Panchagarh", nameBn: "পঞ্চগড়" },
      { slug: "thakurgaon", nameEn: "Thakurgaon", nameBn: "ঠাকুরগাঁও" },
    ],
  },
  {
    slug: "mymensingh",
    nameEn: "Mymensingh",
    nameBn: "ময়মনসিংহ",
    districts: [
      { slug: "mymensingh", nameEn: "Mymensingh", nameBn: "ময়মনসিংহ" },
      { slug: "jamalpur", nameEn: "Jamalpur", nameBn: "জামালপুর" },
      { slug: "netrokona", nameEn: "Netrokona", nameBn: "নেত্রকোনা" },
      { slug: "sherpur", nameEn: "Sherpur", nameBn: "শেরপুর" },
    ],
  },
];

async function seedLocations(): Promise<void> {
  let divisionCount = 0;
  let districtCount = 0;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const div = DIVISIONS[i];
    if (!div) continue;

    const divisionRow = await prisma.location.upsert({
      where: { slug: `div-${div.slug}` },
      update: { nameEn: div.nameEn, nameBn: div.nameBn, sortOrder: i },
      create: {
        slug: `div-${div.slug}`,
        nameEn: div.nameEn,
        nameBn: div.nameBn,
        type: LocationType.DIVISION,
        sortOrder: i,
      },
    });
    divisionCount++;

    for (let j = 0; j < div.districts.length; j++) {
      const dist = div.districts[j];
      if (!dist) continue;

      // District slugs must be globally unique → prefix with division
      await prisma.location.upsert({
        where: { slug: `dist-${div.slug}-${dist.slug}` },
        update: { nameEn: dist.nameEn, nameBn: dist.nameBn, sortOrder: j, parentId: divisionRow.id },
        create: {
          slug: `dist-${div.slug}-${dist.slug}`,
          nameEn: dist.nameEn,
          nameBn: dist.nameBn,
          type: LocationType.DISTRICT,
          sortOrder: j,
          parentId: divisionRow.id,
        },
      });
      districtCount++;
    }
  }

  console.log(`✅ ${divisionCount} divisions + ${districtCount} districts seeded`);
}

// ═══════════════════════════════════════════════════════════
//  4. WEBSITE SETTINGS
// ═══════════════════════════════════════════════════════════

const SETTINGS: { key: string; value: unknown }[] = [
  { key: "site_name", value: "Property Marketplace" },
  { key: "site_tagline", value: "Find a property that feels like home" },
  { key: "contact_phone", value: "+8801700000000" },
  { key: "contact_whatsapp", value: "+8801700000000" },
  { key: "contact_email", value: "support@example.com" },
  { key: "default_locale", value: "en" },
  { key: "max_images_per_property", value: 20 },
  { key: "max_image_size_mb", value: 10 },
  { key: "property_listing_requires_documents", value: false },
  { key: "social_facebook", value: "" },
  { key: "social_youtube", value: "" },
  { key: "seo_title_suffix", value: " | Property Marketplace" },
  { key: "seo_default_description", value: "Buy, sell, and rent properties across Bangladesh — reviewed and verified by our team." },
];

async function seedSettings(): Promise<void> {
  for (const setting of SETTINGS) {
    await prisma.websiteSetting.upsert({
      where: { key: setting.key },
      update: {}, // Never overwrite existing admin-edited values
      create: { key: setting.key, value: setting.value as object },
    });
  }
  console.log(`✅ ${SETTINGS.length} website settings seeded`);
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log("🌱 Seeding started…\n");

  await seedAdmin();
  await seedCategories();
  await seedLocations();
  await seedSettings();

  console.log("\n🎉 Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });