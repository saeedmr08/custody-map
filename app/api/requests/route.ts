import { NextResponse } from "next/server";

import { type RequestType } from "@/lib/custody";
import { createSubjectRequest } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    type?: RequestType;
    subjectRef?: string;
    storeIds?: string[];
  };

  if (body.type !== "access" && body.type !== "delete") {
    return NextResponse.json({ error: "type must be access or delete" }, { status: 400 });
  }
  if (!body.subjectRef || typeof body.subjectRef !== "string") {
    return NextResponse.json({ error: "subjectRef is required" }, { status: 400 });
  }
  if (!Array.isArray(body.storeIds) || body.storeIds.length === 0) {
    return NextResponse.json({ error: "storeIds required" }, { status: 400 });
  }

  try {
    const created = createSubjectRequest(body.type, body.subjectRef, body.storeIds);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
