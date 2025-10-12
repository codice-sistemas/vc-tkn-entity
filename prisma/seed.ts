const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Limpa dados antigos
  await prisma.users.deleteMany({});

  // Cria os usuários
  const c1 = await prisma.users.create({
    data: {
      name: "Client1",
      doc: "docClient1",
      birthDate: new Date("2000-01-01"),
      password: "xptzclient1",
      vcHash: null,
      classCode: "C",
    },
  });

  const c2 = await prisma.users.create({
    data: {
      name: "Client2",
      doc: "docClient2",
      birthDate: new Date("2000-01-01"),
      password: "xptzclient2",
      vcHash: null,
      classCode: "C",
    },
  });

  const p1 = await prisma.users.create({
    data: {
      name: "IParticipant1",
      doc: "docIParticipant1",
      birthDate: new Date("2000-01-01"),
      password: "xptziparticipant1",
      vcHash: null,
        classCode: "P",
  },
  });

  const p2 = await prisma.users.create({
    data: {
      name: "IParticipant2",
      doc: "docIParticipant2",
      birthDate: new Date("2000-01-01"),
      password: "xptziparticipant2",
      vcHash: null,
      classCode: "P",
    },
  });

  console.log("Created:", c1, c2, p1, p2);

  const allUsers = await prisma.users.findMany();
  console.log("List:", allUsers);

  console.log("Read user 1:", await prisma.users.findUnique({ where: { id: c1.id } }));
  console.log("Read user 2:", await prisma.users.findUnique({ where: { id: c2.id } }));
  console.log("Read iparticipant 1:", await prisma.users.findUnique({ where: { id: p1.id } }));
  console.log("Read iparticipant 2:", await prisma.users.findUnique({ where: { id: p2.id } }));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
