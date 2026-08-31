import { NextResponse } from "next/server";

import { rejectSubjectRequest } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  try {
    const updated = rejectSubjectRequest(id, body.note ?? "policy hold (demo)");
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reject failed";
    const status = message === "Request not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
