import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { BookingStatus, PriceLevel, Role } from '../src/generated/prisma/enums.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = 'Password123';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

const categories = [
  { name: 'Hair Salons', slug: 'hair-salons', icon: 'Scissors', description: 'Cuts, colour, styling & treatments', sortOrder: 1 },
  { name: 'Barbershops', slug: 'barbershops', icon: 'Sparkles', description: 'Beard trims, fades & grooming', sortOrder: 2 },
  { name: 'Spa & Massage', slug: 'spa-massage', icon: 'Flower2', description: 'Relax, recharge & unwind', sortOrder: 3 },
  { name: 'Bridal & Makeup', slug: 'bridal-makeup', icon: 'Crown', description: 'Bridal, party & event makeup artists', sortOrder: 4 },
  { name: 'Yoga & Fitness', slug: 'yoga-fitness', icon: 'Dumbbell', description: 'Studios, classes & personal training', sortOrder: 5 },
  { name: 'Tattoo & Piercing', slug: 'tattoo-piercing', icon: 'PenTool', description: 'Custom art from verified studios', sortOrder: 6 },
  { name: 'Skin & Derma', slug: 'skin-derma', icon: 'Stethoscope', description: 'Facials, peels & skin consultations', sortOrder: 7 },
  { name: 'Pet Grooming', slug: 'pet-grooming', icon: 'PawPrint', description: 'Pampering for your furry friends', sortOrder: 8 }
];

type ServiceSeed = { name: string; description: string; durationMin: number; priceInr: number; category: string };
type StaffSeed = { name: string; title: string; bio: string };

type SalonSeed = {
  name: string;
  categorySlug: string;
  tagline: string;
  description: string;
  city: string;
  area: string;
  state: string;
  priceLevel: PriceLevel;
  isVerified: boolean;
  services: ServiceSeed[];
  staff: StaffSeed[];
};

const salons: SalonSeed[] = [
  {
    name: 'Lush Hair Studio',
    categorySlug: 'hair-salons',
    tagline: 'Where every strand tells a story',
    description:
      'A contemporary unisex hair studio in the heart of Indiranagar offering precision cuts, balayage and keratin treatments using premium L’Oréal and Wella products.',
    city: 'Bengaluru',
    area: 'Indiranagar',
    state: 'Karnataka',
    priceLevel: PriceLevel.PREMIUM,
    isVerified: true,
    services: [
      { name: 'Signature Haircut & Style', description: 'Consultation, wash, cut and blow-dry', durationMin: 45, priceInr: 799, category: 'Hair' },
      { name: 'Global Hair Colour', description: 'Full-head ammonia-free colour', durationMin: 120, priceInr: 2499, category: 'Colour' },
      { name: 'Keratin Smoothening', description: 'Frizz-free, salon-smooth hair for months', durationMin: 180, priceInr: 4999, category: 'Treatment' },
      { name: 'Balayage Highlights', description: 'Hand-painted, sun-kissed highlights', durationMin: 150, priceInr: 3999, category: 'Colour' }
    ],
    staff: [
      { name: 'Aarti Menon', title: 'Senior Stylist', bio: '12 years of styling, colour specialist' },
      { name: 'Rohit Sharma', title: 'Creative Director', bio: 'Trained in London, editorial expert' }
    ]
  },
  {
    name: 'The Gentlemen’s Den',
    categorySlug: 'barbershops',
    tagline: 'Classic grooming, modern attitude',
    description:
      'An old-school barbershop reimagined. Hot-towel shaves, beard sculpting and sharp fades in a relaxed, members-club atmosphere.',
    city: 'Bengaluru',
    area: 'Koramangala',
    state: 'Karnataka',
    priceLevel: PriceLevel.MODERATE,
    isVerified: true,
    services: [
      { name: 'Classic Haircut', description: 'Scissor or machine cut with styling', durationMin: 30, priceInr: 399, category: 'Hair' },
      { name: 'Royal Beard Trim', description: 'Shape-up with hot towel and oils', durationMin: 25, priceInr: 299, category: 'Beard' },
      { name: 'Hot Towel Shave', description: 'Traditional straight-razor shave', durationMin: 30, priceInr: 449, category: 'Shave' },
      { name: 'Hair + Beard Combo', description: 'The full gentleman’s package', durationMin: 50, priceInr: 599, category: 'Combo' }
    ],
    staff: [
      { name: 'Imran Khan', title: 'Master Barber', bio: 'Fade specialist, 9 years on the chair' }
    ]
  },
  {
    name: 'Serenity Spa & Wellness',
    categorySlug: 'spa-massage',
    tagline: 'Your urban escape',
    description:
      'A tranquil day spa offering Balinese, deep-tissue and aromatherapy massages, plus signature facials in private candle-lit rooms.',
    city: 'Mumbai',
    area: 'Bandra West',
    state: 'Maharashtra',
    priceLevel: PriceLevel.LUXURY,
    isVerified: true,
    services: [
      { name: 'Aromatherapy Massage', description: '60-min full-body relaxation', durationMin: 60, priceInr: 2200, category: 'Massage' },
      { name: 'Deep Tissue Massage', description: 'Targets knots and chronic tension', durationMin: 75, priceInr: 2800, category: 'Massage' },
      { name: 'Signature Glow Facial', description: 'Brightening facial with serums', durationMin: 60, priceInr: 1899, category: 'Facial' }
    ],
    staff: [
      { name: 'Lena Dsouza', title: 'Lead Therapist', bio: 'Certified in Balinese & Swedish techniques' }
    ]
  },
  {
    name: 'Blush by Niharika',
    categorySlug: 'bridal-makeup',
    tagline: 'Glow like never before',
    description:
      'Award-winning bridal makeup artistry. HD and airbrush bridal looks, engagement and party makeup with premium, skin-friendly products.',
    city: 'Pune',
    area: 'Koregaon Park',
    state: 'Maharashtra',
    priceLevel: PriceLevel.PREMIUM,
    isVerified: false,
    services: [
      { name: 'Party Makeup', description: 'Glam look for events & parties', durationMin: 60, priceInr: 2500, category: 'Makeup' },
      { name: 'Engagement Makeup', description: 'HD makeup with hairstyling', durationMin: 90, priceInr: 6000, category: 'Makeup' },
      { name: 'Bridal Package', description: 'Full bridal look with draping', durationMin: 150, priceInr: 18000, category: 'Bridal' }
    ],
    staff: [
      { name: 'Niharika Joshi', title: 'Lead MUA', bio: '500+ brides, featured in WedMeGood' }
    ]
  },
  {
    name: 'Prana Yoga Collective',
    categorySlug: 'yoga-fitness',
    tagline: 'Breathe. Move. Belong.',
    description:
      'A community-led studio offering Hatha, Vinyasa and Power Yoga, plus meditation and prenatal classes for all levels.',
    city: 'Bengaluru',
    area: 'HSR Layout',
    state: 'Karnataka',
    priceLevel: PriceLevel.MODERATE,
    isVerified: true,
    services: [
      { name: 'Drop-in Yoga Class', description: 'Single Vinyasa or Hatha session', durationMin: 60, priceInr: 400, category: 'Class' },
      { name: 'Power Yoga Session', description: 'High-energy strength flow', durationMin: 60, priceInr: 500, category: 'Class' },
      { name: 'Private 1:1 Session', description: 'Personalised practice with a coach', durationMin: 60, priceInr: 1200, category: 'Personal' }
    ],
    staff: [
      { name: 'Deepa Iyer', title: 'Founder & Lead Coach', bio: 'RYT-500 certified, 14 years teaching' }
    ]
  },
  {
    name: 'Inkraft Tattoo Studio',
    categorySlug: 'tattoo-piercing',
    tagline: 'Art that lasts a lifetime',
    description:
      'A hygiene-first custom tattoo studio. Fine-line, realism and traditional styles by award-winning artists. Sterile, single-use needles.',
    city: 'Mumbai',
    area: 'Andheri West',
    state: 'Maharashtra',
    priceLevel: PriceLevel.PREMIUM,
    isVerified: true,
    services: [
      { name: 'Small Tattoo (up to 2 inch)', description: 'Minimal fine-line design', durationMin: 60, priceInr: 2000, category: 'Tattoo' },
      { name: 'Custom Sleeve Consultation', description: 'Design session for large work', durationMin: 45, priceInr: 1000, category: 'Consult' },
      { name: 'Ear Piercing', description: 'Single lobe with sterile studs', durationMin: 20, priceInr: 800, category: 'Piercing' }
    ],
    staff: [
      { name: 'Kabir Rao', title: 'Resident Artist', bio: 'Realism & blackwork specialist' }
    ]
  }
];

async function main() {
  console.log('\u{1F331} Seeding Sundara marketplace data…');

  // Clear marketplace data in dependency order (dev seed only).
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.category.deleteMany();

  const demoEmails = [
    'admin@sundara.app',
    'owner@sundara.app',
    'priya@sundara.app',
    'customer@sundara.app'
  ];
  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Categories
  const categoryRecords = await Promise.all(
    categories.map((category) => prisma.category.create({ data: category }))
  );
  const categoryBySlug = new Map(categoryRecords.map((category) => [category.slug, category]));
  console.log(`  ✓ ${categoryRecords.length} categories`);

  // Users
  await prisma.user.create({
    data: { name: 'Sundara Admin', email: 'admin@sundara.app', role: Role.ADMIN, passwordHash, phone: '+919000000001' }
  });

  const owner = await prisma.user.create({
    data: { name: 'Rahul Verma', email: 'owner@sundara.app', role: Role.SALON_OWNER, passwordHash, phone: '+919000000002' }
  });
  const owner2 = await prisma.user.create({
    data: { name: 'Priya Nair', email: 'priya@sundara.app', role: Role.SALON_OWNER, passwordHash, phone: '+919000000003' }
  });

  const customer = await prisma.user.create({
    data: { name: 'Ananya Gupta', email: 'customer@sundara.app', role: Role.CUSTOMER, passwordHash, phone: '+919000000004' }
  });

  // Salons
  const createdSalons = [];
  for (let i = 0; i < salons.length; i += 1) {
    const seed = salons[i];
    const category = categoryBySlug.get(seed.categorySlug)!;
    const slug = seed.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const salon = await prisma.salon.create({
      data: {
        ownerId: i % 2 === 0 ? owner.id : owner2.id,
        categoryId: category.id,
        name: seed.name,
        slug,
        tagline: seed.tagline,
        description: seed.description,
        coverImage: img(`${slug}-cover`),
        images: [img(`${slug}-1`), img(`${slug}-2`), img(`${slug}-3`)],
        phone: '+9180' + (40000000 + i),
        email: `hello@${slug}.in`,
        addressLine: `${10 + i}, ${seed.area} Main Road`,
        area: seed.area,
        city: seed.city,
        state: seed.state,
        pincode: '5600' + (10 + i),
        priceLevel: seed.priceLevel,
        isVerified: seed.isVerified,
        openingHours: {
          mon: '09:00-20:00', tue: '09:00-20:00', wed: '09:00-20:00',
          thu: '09:00-20:00', fri: '09:00-21:00', sat: '09:00-21:00', sun: '10:00-18:00'
        },
        services: { create: seed.services },
        staff: { create: seed.staff }
      },
      include: { services: true }
    });
    createdSalons.push(salon);
  }
  console.log(`  ✓ ${createdSalons.length} salons with services & staff`);

  // Bookings + reviews for the demo customer
  const now = Date.now();
  let bookingCount = 0;
  let reviewCount = 0;

  for (let i = 0; i < createdSalons.length; i += 1) {
    const salon = createdSalons[i];
    const service = salon.services[0];

    // One completed (past) booking with a review
    const completed = await prisma.booking.create({
      data: {
        customerId: customer.id,
        salonId: salon.id,
        serviceId: service.id,
        scheduledAt: new Date(now - (i + 2) * 24 * 60 * 60 * 1000),
        durationMin: service.durationMin,
        totalInr: service.priceInr,
        tokenPaidInr: Math.min(service.priceInr, 100),
        status: BookingStatus.COMPLETED
      }
    });
    bookingCount += 1;

    if (i % 2 === 0) {
      await prisma.review.create({
        data: {
          salonId: salon.id,
          customerId: customer.id,
          bookingId: completed.id,
          rating: 4 + (i % 2),
          comment: 'Fantastic experience — professional staff and spotless space. Highly recommend!'
        }
      });
      reviewCount += 1;
    }

    // One upcoming booking
    await prisma.booking.create({
      data: {
        customerId: customer.id,
        salonId: salon.id,
        serviceId: service.id,
        scheduledAt: new Date(now + (i + 1) * 24 * 60 * 60 * 1000),
        durationMin: service.durationMin,
        totalInr: service.priceInr,
        tokenPaidInr: Math.min(service.priceInr, 100),
        status: i % 3 === 0 ? BookingStatus.CONFIRMED : BookingStatus.PENDING
      }
    });
    bookingCount += 1;
  }

  // Recompute cached salon ratings
  for (const salon of createdSalons) {
    const aggregate = await prisma.review.aggregate({
      where: { salonId: salon.id },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await prisma.salon.update({
      where: { id: salon.id },
      data: {
        ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
        ratingCount: aggregate._count.rating
      }
    });
  }

  console.log(`  ✓ ${bookingCount} bookings, ${reviewCount} reviews`);
  console.log('\n✨ Seed complete. Demo logins (password: ' + DEMO_PASSWORD + '):');
  console.log('   Admin          admin@sundara.app');
  console.log('   Salon owner    owner@sundara.app  /  priya@sundara.app');
  console.log('   Customer       customer@sundara.app');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
