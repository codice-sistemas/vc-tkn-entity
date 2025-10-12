import { NextResponse } from 'next/server';
import { getTxReceipt } from '@/libs/chain';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tx = url.searchParams.get('txHash');
  if (!tx) return NextResponse.json({ error: 'txHash required' }, { status: 400 });
  try {
    const receipt = await getTxReceipt(tx);
    return NextResponse.json({ data: receipt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}