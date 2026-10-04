/**
 * Grants or revokes administrator rights.
 *
 *   npm run admin:grant  -- someone@example.com
 *   npm run admin:revoke -- someone@example.com
 *   npm run admin:list
 *
 * This is the only way to become an administrator. There is no form, no
 * invitation and no first-user-wins rule, because every one of those is a path
 * from "can register" to "can change what the platform trades" — and anyone can
 * register.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 3,
});
const prisma = new PrismaClient({ adapter });

async function list() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
    orderBy: { id: "asc" },
  });

  if (admins.length === 0) {
    console.log("No administrators. Grant one with: npm run admin:grant -- <email>");
    return;
  }
  console.log(`${admins.length} administrator(s):`);
  for (const admin of admins) console.log(`  ${admin.id}  ${admin.email}${admin.name ? `  (${admin.name})` : ""}`);
}

async function setRole(email: string, role: "ADMIN" | "USER") {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`No account for ${email}. Register it first.`);
    process.exitCode = 1;
    return;
  }
  if (user.role === role) {
    console.log(`${user.email} is already ${role}.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${user.email} is now ${role}.`);
  /*
   * The role rides in the session token, which is signed and not re-read from
   * the database on every request. Someone already signed in keeps the role
   * they had until their token is reissued.
   */
  console.log("They have to sign out and back in for this to take effect.");
}

async function main() {
  const [command, email] = process.argv.slice(2);

  if (command === "list") return list();
  if ((command === "grant" || command === "revoke") && email) {
    return setRole(email, command === "grant" ? "ADMIN" : "USER");
  }

  console.error("Usage: grant-admin.ts <grant|revoke> <email> | list");
  process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
