import { NextResponse } from "next/server";

import { advanceSubjectRequest } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const updated = advanceSubjectRequest(id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Advance failed";
    const status = message === "Request not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
