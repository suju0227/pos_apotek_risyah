const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const roles = [
  { name: 'KASIR', description: 'Kasir apotek untuk transaksi penjualan.' },
  { name: 'APOTEKER', description: 'Apoteker untuk pelayanan resep dan konseling.' },
  { name: 'MANAGER', description: 'Manager apotek untuk pengelolaan data dan laporan.' },
  { name: 'PEMILIK', description: 'Pemilik apotek untuk akses ringkasan bisnis.' },
];

const units = [
  { name: 'tablet', symbol: 'tablet' },
  { name: 'kaplet', symbol: 'kaplet' },
  { name: 'kapsul', symbol: 'kapsul' },
  { name: 'strip', symbol: 'strip' },
  { name: 'box', symbol: 'box' },
  { name: 'botol', symbol: 'botol' },
  { name: 'tube', symbol: 'tube' },
  { name: 'sachet', symbol: 'sachet' },
  { name: 'biji', symbol: 'biji' },
  { name: 'pcs', symbol: 'pcs' },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: { symbol: unit.symbol, isActive: true },
      create: unit,
    });
  }

  const dosageForms = [
    { code: 'TAB', name: 'Tablet', description: 'Sediaan padat kompak dibuat secara kempa cetak' },
    { code: 'KPL', name: 'Kaplet', description: 'Tablet berbentuk kapsul' },
    { code: 'KPS', name: 'Kapsul', description: 'Sediaan padat yang terdiri dari obat dalam cangkang keras atau lunak' },
    { code: 'SRP', name: 'Sirup', description: 'Sediaan cair berupa larutan yang mengandung sukrosa' },
    { code: 'SRK', name: 'Sirup Kering', description: 'Sediaan kering yang dilarutkan dengan air sebelum digunakan' },
    { code: 'SPS', name: 'Suspensi', description: 'Sediaan cair yang mengandung partikel padat tidak larut terdispersi' },
    { code: 'DRP', name: 'Drops', description: 'Sediaan cair obat tetes oral' },
    { code: 'IJK', name: 'Injeksi', description: 'Sediaan steril berupa larutan, emulsi atau suspensi untuk parenteral' },
    { code: 'IFS', name: 'Infus', description: 'Sediaan steril berupa larutan atau emulsi untuk intravena volume besar' },
    { code: 'KRM', name: 'Krim', description: 'Sediaan setengah padat berupa emulsi' },
    { code: 'SLP', name: 'Salep', description: 'Sediaan setengah padat ditujukan untuk pemakaian topikal' },
    { code: 'GEL', name: 'Gel', description: 'Sediaan setengah padat fase cair terperangkap dalam matriks tiga dimensi' },
    { code: 'LTN', name: 'Lotion', description: 'Sediaan cair pemakaian luar' },
    { code: 'SPR', name: 'Spray', description: 'Sediaan semprot' },
    { code: 'PTC', name: 'Patch', description: 'Sediaan koyo/tempel transdermal' },
    { code: 'SUP', name: 'Suppositoria', description: 'Sediaan padat dimasukkan melalui dubur/rektal' },
    { code: 'SRB', name: 'Serbuk', description: 'Campuran kering bahan obat atau zat kimia yang dihaluskan' },
    { code: 'GRN', name: 'Granul', description: 'Sediaan berupa butiran' },
    { code: 'EML', name: 'Emulsi', description: 'Sediaan cair berupa campuran dua cairan yang tidak bercampur' },
    { code: 'ELK', name: 'Eliksir', description: 'Sediaan cair berupa larutan hidroalkohol manis' },
    { code: 'OVL', name: 'Ovula', description: 'Sediaan padat dimasukkan melalui vagina' },
    { code: 'INH', name: 'Inhaler', description: 'Sediaan hirup' },
    { code: 'IPL', name: 'Implan', description: 'Sediaan padat steril dimasukkan di bawah kulit' },
    { code: 'TTM', name: 'Tetes Mata', description: 'Sediaan steril obat tetes mata' },
    { code: 'TTL', name: 'Tetes Telinga', description: 'Sediaan obat tetes telinga' },
    { code: 'TTH', name: 'Tetes Hidung', description: 'Sediaan obat tetes hidung' },
  ];

  for (let i = 0; i < dosageForms.length; i++) {
    const df = dosageForms[i];
    await prisma.dosageForm.upsert({
      where: { name: df.name },
      update: { code: df.code, description: df.description, sortOrder: i, isActive: true },
      create: { ...df, sortOrder: i, isActive: true },
    });
  }

  const managerRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'MANAGER' },
  });

  const passwordHash = await bcrypt.hash('AdminApotek!2026', 12);

  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {
      roleId: managerRole.id,
      name: 'Manager Apotek',
      email: 'manager@risyah.local',
      isActive: true,
    },
    create: {
      roleId: managerRole.id,
      name: 'Manager Apotek',
      username: 'manager',
      email: 'manager@risyah.local',
      passwordHash,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
