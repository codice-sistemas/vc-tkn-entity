/*
import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  const skip = (page - 1) * limit;

  const where = q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { aaHash: { contains: q } }] } : {};

  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.client.count({ where })
  ]);

  return NextResponse.json({ data: items, total });
}
*/

/*
import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  const skip = (page - 1) * limit;

  const where = q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { aaHash: { contains: q } }] } : {};

  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.client.count({ where })
  ]);

  return NextResponse.json({ data: items, total });
}
*/

import { NextResponse } from 'next/server';
import { initDB } from '@/libs/mysql/db-mysql';
import { UserRepository } from '@/libs/mysql/userRepository-mysql';

export async function GET() {
  const db = await initDB();
  const repo = new UserRepository(db);
  const users = await repo.list("P");
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
