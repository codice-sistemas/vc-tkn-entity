import { NextResponse } from 'next/server';
import { initDB } from '@/libs/mysql/db-mysql';
import { UserRepository } from '@/libs/mysql/userRepository-mysql';

export async function GET() {
  const db = await initDB();
  const repo = new UserRepository(db);
  const users = await repo.list("C");
  await db.end();
  return NextResponse.json({ data: users});
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, doc, birthDate, password, vcHash } = body;
  const db = await initDB();
  const repo = new UserRepository(db);
  const user = await repo.create(name, doc, birthDate, password, vcHash);
  await db.end();
  return NextResponse.json(user, { status: 201 });
}
