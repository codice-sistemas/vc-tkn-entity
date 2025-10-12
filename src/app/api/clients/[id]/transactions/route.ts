import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

export async function GET(req: Request, { params }: any) {
  const { id } = params;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  const skip = (page - 1) * limit;

  const items = await prisma.transaction.findMany({
    where: { clientId: Number(id) },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  return NextResponse.json({ data: items });
}