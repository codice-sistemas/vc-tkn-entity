import { NextResponse } from 'next/server';
import { verifyCredentials, signToken } from '@/libs/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;
  const user = await verifyCredentials(email, password);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = signToken({ sub: user.id, email: user.email });
  return NextResponse.json({ token });
}