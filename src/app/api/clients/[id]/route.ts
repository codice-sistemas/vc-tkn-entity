/*
import { NextResponse } from 'next/server';
import { initDB } from '@/libs/mysql/db-mysql';
import { UserRepository } from '@/libs/mysql/userRepository-mysql';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = await initDB();
  const repo = new UserRepository(db);
  const user = await repo.read(Number(params.id));
  await db.end();
  return NextResponse.json(user);
//  NextResponse.json({ data: user ? [user] : [] });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const db = await initDB();
  const repo = new UserRepository(db);
  const updated = await repo.update(Number(params.id), data);
  await db.end();
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const db = await initDB();
  const repo = new UserRepository(db);
  await repo.delete(Number(params.id));
  await db.end();
  return NextResponse.json({ deleted: true });
}
*/

// src/app/api/clients/[id]/route.ts
import { NextResponse } from 'next/server';
import { initDB } from '@/libs/mysql/db-mysql';
import { UserRepository } from '@/libs/mysql/userRepository-mysql';
import { getTokensByHash } from '@/libs/blockchain/tokenService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = await initDB();
  const repo = new UserRepository(db);

  const user = await repo.read(Number(params.id));
  if (!user) {
    await db.end();
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Consulta tokens na blockchain
  const tokens = await getTokensByHash(user.vcHash || user.ifHash);

  await db.end();

  return NextResponse.json({
    user,
    tokens
  });
}
