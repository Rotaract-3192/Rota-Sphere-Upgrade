import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "RotaSphere operates on Direct Non-Profit UPI Settlement (0% platform fee)." },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    { message: "RotaSphere operates on Direct Non-Profit UPI Settlement (0% platform fee)." },
    { status: 200 }
  );
}
