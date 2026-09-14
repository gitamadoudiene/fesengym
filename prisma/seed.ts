/**
 * Données de démonstration — voir ARCHITECTURE.md / brief §41.
 * Aucune donnée personnelle réelle : noms, contacts et documents sont
 * fictifs. Exécuter avec `npm run db:seed`.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seed — démarrage...");

  // -------------------------------------------------------------------
  // Saison
  // -------------------------------------------------------------------
  const season = await prisma.season.upsert({
    where: { name: "2026-2027" },
    update: {},
    create: {
      name: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-08-31"),
      status: "ACTIVE",
      isCurrent: true,
    },
  });

  // -------------------------------------------------------------------
  // Disciplines (référentiel FSG — voir brief §8)
  // -------------------------------------------------------------------
  const disciplineDefs = [
    { code: "GAF", name: "Gymnastique Artistique Féminine" },
    { code: "GAM", name: "Gymnastique Artistique Masculine" },
    { code: "GR", name: "Gymnastique Rythmique" },
    { code: "TRA", name: "Trampoline" },
    { code: "TUM", name: "Tumbling" },
    { code: "AER", name: "Gymnastique Aérobic" },
  ];

  const disciplines = new Map<string, string>();
  for (const def of disciplineDefs) {
    const discipline = await prisma.discipline.upsert({
      where: { code: def.code },
      update: {},
      create: def,
    });
    disciplines.set(def.code, discipline.id);
  }

  // -------------------------------------------------------------------
  // Catégories (indépendantes d'une discipline précise pour ce seed)
  // -------------------------------------------------------------------
  const categoryDefs = [
    { name: "Baby", minAge: 4, maxAge: 6 },
    { name: "Poussin", minAge: 7, maxAge: 8 },
    { name: "Benjamin", minAge: 9, maxAge: 10 },
    { name: "Minime", minAge: 11, maxAge: 12 },
    { name: "Cadet", minAge: 13, maxAge: 15 },
    { name: "Junior", minAge: 16, maxAge: 17 },
    { name: "Senior", minAge: 18, maxAge: 99 },
  ];

  const categories: string[] = [];
  for (const def of categoryDefs) {
    const existing = await prisma.category.findFirst({ where: { name: def.name } });
    const category =
      existing ??
      (await prisma.category.create({
        data: def,
      }));
    categories.push(category.id);
  }

  // -------------------------------------------------------------------
  // Tarifs (voir brief §60 — exemples uniquement)
  // -------------------------------------------------------------------
  const juniorOrBelow = categoryDefs.findIndex((c) => c.name === "Junior");
  for (let i = 0; i < categories.length; i++) {
    const isSenior = i > juniorOrBelow;
    await prisma.licenseFee.upsert({
      where: { id: `seed-fee-${categories[i]}` },
      update: {},
      create: {
        id: `seed-fee-${categories[i]}`,
        seasonId: season.id,
        categoryId: categories[i],
        requestType: "NEW",
        amount: isSenior ? 15000 : 10000,
        currency: "XOF",
      },
    });
  }

  // -------------------------------------------------------------------
  // Clubs
  // -------------------------------------------------------------------
  const dakarGym = await prisma.club.upsert({
    where: { code: "DKR-001" },
    update: {},
    create: {
      code: "DKR-001",
      name: "Dakar Gym Club",
      acronym: "DGC",
      affiliationNumber: "FSG-AFF-0001",
      address: "Square Stade Iba Mar Diop",
      city: "Dakar",
      region: "Dakar",
      phone: "+221 33 821 04 15",
      email: "contact@dakargym.sn",
      managerName: "Aïssatou Diallo",
      presidentName: "Moussa Fall",
      status: "ACTIVE",
      foundedAt: new Date("2010-01-01"),
    },
  });

  const thiesGym = await prisma.club.upsert({
    where: { code: "THS-001" },
    update: {},
    create: {
      code: "THS-001",
      name: "Thiès Gymnastique",
      acronym: "TG",
      affiliationNumber: "FSG-AFF-0002",
      city: "Thiès",
      region: "Thiès",
      phone: "+221 33 951 22 33",
      email: "contact@thiesgym.sn",
      managerName: "Ibrahima Sarr",
      presidentName: "Fatou Ndoye",
      status: "ACTIVE",
      foundedAt: new Date("2015-06-01"),
    },
  });

  // -------------------------------------------------------------------
  // Utilisateurs
  // -------------------------------------------------------------------
  const users = [
    {
      email: "superadmin@fsg.sn",
      firstName: "Amadou",
      lastName: "Ba",
      role: "SUPER_ADMIN" as const,
      password: "SuperAdmin123!",
      clubId: null as string | null,
    },
    {
      email: "admin@fsg.sn",
      firstName: "Khadija",
      lastName: "Sow",
      role: "FEDERAL_ADMIN" as const,
      password: "AdminFederal123!",
      clubId: null,
    },
    {
      email: "agent@fsg.sn",
      firstName: "Cheikh",
      lastName: "Diop",
      role: "AGENT" as const,
      password: "Agent123!",
      clubId: null,
    },
    {
      email: "club.dakar@fsg.sn",
      firstName: "Aïssatou",
      lastName: "Diallo",
      role: "CLUB_MANAGER" as const,
      password: "ClubDakar123!",
      clubId: dakarGym.id,
    },
    {
      email: "club.thies@fsg.sn",
      firstName: "Ibrahima",
      lastName: "Sarr",
      role: "CLUB_MANAGER" as const,
      password: "ClubThies123!",
      clubId: thiesGym.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        clubId: u.clubId,
        passwordHash: await hash(u.password),
        status: "ACTIVE",
      },
    });
  }

  console.log("Seed — terminé.");
  console.log("");
  console.log("Comptes de démonstration (mot de passe entre parenthèses) :");
  for (const u of users) {
    console.log(`  ${u.role.padEnd(14)} ${u.email.padEnd(24)} (${u.password})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
