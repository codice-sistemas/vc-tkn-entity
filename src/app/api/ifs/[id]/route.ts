// src/app/api/ifs/[id]/route.ts
import { NextResponse } from 'next/server';
import { initDB } from '@/libs/mysql/db-mysql';
import { UserRepository } from '@/libs/mysql/userRepository-mysql';
import { getTokensByHashAA } from '@/./libs/blockchain/tokenService';

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
//  const tokens = await getTokensByHashAA(user.vcHash || user.ifHash);
  const tokens = await getTokensByHashAA(user.vcHash);

  await db.end();

  return NextResponse.json({
    user: user,
//    tokens: Array.from(tokens.values())
    tokens: Array.from(tokens.tokens)
  });
}
