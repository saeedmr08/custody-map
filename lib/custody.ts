/**
 * CustodyMap — synthetic personal-data flow atlas.
 * Sources → processors → stores with retention and access/delete request demos.
 * No real personal data is collected or stored.
 */

export type NodeKind = "source" | "processor" | "store";

export interface FlowNode {
  id: string;
  kind: NodeKind;
  label: string;
  purpose: string;
  /** Retention in days; null = ephemeral / not retained */
  retentionDays: number | null;
  region: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  dataCategory: string;
}

export type RequestType = "access" | "delete";
export type RequestStatus =
  | "submitted"
  | "verifying"
  | "in-progress"
  | "fulfilled"
  | "rejected";

export interface SubjectRequest {
  id: string;
  type: RequestType;
  subjectRef: string;
  storeIds: string[];
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  note?: string;
}

export interface RetentionCheck {
  storeId: string;
  collectedAt: number;
  asOf: number;
  retentionDays: number | null;
  expiresAt: number | null;
  expired: boolean;
}

export interface CustodyGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export const DEMO_GRAPH: CustodyGraph = {
  nodes: [
    {
      id: "src-web",
      kind: "source",
      label: "Web form (demo)",
      purpose: "Collect contact preferences",
      retentionDays: null,
      region: "eu-central",
    },
    {
      id: "src-support",
      kind: "source",
      label: "Support inbox (demo)",
      purpose: "Ticket correspondence",
      retentionDays: null,
      region: "eu-central",
    },
    {
      id: "proc-enrich",
      kind: "processor",
      label: "Enrichment worker",
      purpose: "Normalize fields, drop unused",
      retentionDays: 7,
      region: "eu-central",
    },
    {
      id: "proc-analytics",
      kind: "processor",
      label: "Analytics aggregator",
      purpose: "Aggregate counts only",
      retentionDays: 30,
      region: "eu-west",
    },
    {
      id: "store-crm",
      kind: "store",
      label: "CRM vault",
      purpose: "Active customer records",
      retentionDays: 365,
      region: "eu-central",
    },
    {
      id: "store-archive",
      kind: "store",
      label: "Cold archive",
      purpose: "Legal hold sandbox",
      retentionDays: 730,
      region: "eu-north",
    },
    {
      id: "store-logs",
      kind: "store",
      label: "Ops log lake",
      purpose: "Debug traces (hashed ids)",
      retentionDays: 90,
      region: "eu-west",
    },
  ],
  edges: [
    { id: "e1", from: "src-web", to: "proc-enrich", dataCategory: "contact" },
    { id: "e2", from: "src-support", to: "proc-enrich", dataCategory: "support" },
    { id: "e3", from: "proc-enrich", to: "store-crm", dataCategory: "profile" },
    { id: "e4", from: "proc-enrich", to: "proc-analytics", dataCategory: "events" },
    { id: "e5", from: "proc-analytics", to: "store-logs", dataCategory: "metrics" },
    { id: "e6", from: "store-crm", to: "store-archive", dataCategory: "profile" },
  ],
};

const DAY = 24 * 60 * 60 * 1000;
let reqSeq = 0;

export function nodesByKind(graph: CustodyGraph, kind: NodeKind): FlowNode[] {
  return graph.nodes.filter((n) => n.kind === kind);
}

export function outbound(graph: CustodyGraph, nodeId: string): FlowEdge[] {
  return graph.edges.filter((e) => e.from === nodeId);
}

export function inbound(graph: CustodyGraph, nodeId: string): FlowEdge[] {
  return graph.edges.filter((e) => e.to === nodeId);
}

export function pathExists(
  graph: CustodyGraph,
  fromId: string,
  toId: string,
): boolean {
  const seen = new Set<string>();
  const stack = [fromId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === toId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const e of outbound(graph, cur)) stack.push(e.to);
  }
  return false;
}

export function checkRetention(
  store: FlowNode,
  collectedAt: number,
  asOf: number,
): RetentionCheck {
  if (store.kind !== "store" && store.kind !== "processor") {
    throw new Error("Retention applies to processor/store nodes");
  }
  if (asOf < collectedAt) {
    throw new Error("asOf must be >= collectedAt");
  }
  if (store.retentionDays === null) {
    return {
      storeId: store.id,
      collectedAt,
      asOf,
      retentionDays: null,
      expiresAt: null,
      expired: false,
    };
  }
  const expiresAt = collectedAt + store.retentionDays * DAY;
  return {
    storeId: store.id,
    collectedAt,
    asOf,
    retentionDays: store.retentionDays,
    expiresAt,
    expired: asOf >= expiresAt,
  };
}

const REQUEST_FLOW: RequestStatus[] = [
  "submitted",
  "verifying",
  "in-progress",
  "fulfilled",
];

export function submitRequest(
  type: RequestType,
  subjectRef: string,
  storeIds: string[],
  at: number,
): SubjectRequest {
  if (!subjectRef.trim()) throw new Error("subjectRef required");
  if (storeIds.length === 0) throw new Error("at least one storeId required");
  reqSeq += 1;
  return {
    id: `req_${reqSeq}`,
    type,
    subjectRef: subjectRef.trim(),
    storeIds: [...storeIds],
    status: "submitted",
    createdAt: at,
    updatedAt: at,
  };
}

export function advanceRequest(
  request: SubjectRequest,
  at: number,
  note?: string,
): SubjectRequest {
  if (request.status === "fulfilled" || request.status === "rejected") {
    throw new Error(`Request already ${request.status}`);
  }
  const idx = REQUEST_FLOW.indexOf(request.status);
  if (idx < 0 || idx >= REQUEST_FLOW.length - 1) {
    throw new Error(`Cannot advance from ${request.status}`);
  }
  return {
    ...request,
    status: REQUEST_FLOW[idx + 1],
    updatedAt: at,
    note: note ?? request.note,
  };
}

export function rejectRequest(
  request: SubjectRequest,
  at: number,
  note: string,
): SubjectRequest {
  if (request.status === "fulfilled" || request.status === "rejected") {
    throw new Error(`Request already ${request.status}`);
  }
  return {
    ...request,
    status: "rejected",
    updatedAt: at,
    note,
  };
}

/** Stores still holding data for a synthetic collection timestamp. */
export function activeStores(
  graph: CustodyGraph,
  collectedAt: number,
  asOf: number,
): FlowNode[] {
  return nodesByKind(graph, "store").filter((s) => {
    const check = checkRetention(s, collectedAt, asOf);
    return !check.expired;
  });
}
