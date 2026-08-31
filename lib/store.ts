import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DEMO_GRAPH,
  advanceRequest,
  rejectRequest,
  submitRequest,
  type CustodyGraph,
  type RequestType,
  type SubjectRequest,
} from "./custody";

export interface CustodyData {
  graph: CustodyGraph;
  requests: SubjectRequest[];
}

const DATA_FILE = path.join(process.cwd(), "data", "custody.json");

const seed: CustodyData = {
  graph: DEMO_GRAPH,
  requests: [],
};

function nextRequestId(requests: SubjectRequest[]): string {
  let max = 0;
  for (const request of requests) {
    const match = /^req_(\d+)$/.exec(request.id);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return `req_${max + 1}`;
}

export function readCustody(): CustodyData {
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8")) as CustodyData;
  } catch {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, `${JSON.stringify(seed, null, 2)}\n`);
    return {
      graph: DEMO_GRAPH,
      requests: [],
    };
  }
}

export function writeCustody(data: CustodyData): void {
  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
}

export function createSubjectRequest(
  type: RequestType,
  subjectRef: string,
  storeIds: string[],
): SubjectRequest {
  const data = readCustody();
  const drafted = submitRequest(type, subjectRef, storeIds, Date.now());
  const request: SubjectRequest = {
    ...drafted,
    id: nextRequestId(data.requests),
  };
  data.requests = [request, ...data.requests];
  writeCustody(data);
  return request;
}

export function advanceSubjectRequest(id: string): SubjectRequest {
  const data = readCustody();
  const current = data.requests.find((request) => request.id === id);
  if (!current) {
    throw new Error("Request not found");
  }
  const updated = advanceRequest(current, Date.now());
  data.requests = data.requests.map((request) =>
    request.id === id ? updated : request,
  );
  writeCustody(data);
  return updated;
}

export function rejectSubjectRequest(id: string, note: string): SubjectRequest {
  const data = readCustody();
  const current = data.requests.find((request) => request.id === id);
  if (!current) {
    throw new Error("Request not found");
  }
  const updated = rejectRequest(current, Date.now(), note);
  data.requests = data.requests.map((request) =>
    request.id === id ? updated : request,
  );
  writeCustody(data);
  return updated;
}
