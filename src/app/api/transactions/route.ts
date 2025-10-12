import { NextResponse } from 'next/server';
import prisma from '@libs/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (url.searchParams.get('status')) filters.status = url.searchParams.get('status');

  const items = await prisma.transaction.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  return NextResponse.json({ data: items });
}