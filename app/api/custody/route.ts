import { NextResponse } from "next/server";

import { readCustody } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ data: readCustody() });
}
