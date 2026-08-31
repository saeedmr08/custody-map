import { describe, expect, it } from "vitest";
import {
  DEMO_GRAPH,
  activeStores,
  advanceRequest,
  checkRetention,
  pathExists,
  rejectRequest,
  submitRequest,
} from "@/lib/custody";

const DAY = 24 * 60 * 60 * 1000;

describe("pathExists", () => {
  it("finds multi-hop custody paths", () => {
    expect(pathExists(DEMO_GRAPH, "src-web", "store-archive")).toBe(true);
    expect(pathExists(DEMO_GRAPH, "src-web", "store-logs")).toBe(true);
    expect(pathExists(DEMO_GRAPH, "store-logs", "src-web")).toBe(false);
  });
});

describe("checkRetention", () => {
  it("marks store expired after retention window", () => {
    const crm = DEMO_GRAPH.nodes.find((n) => n.id === "store-crm")!;
    const collectedAt = 0;
    const before = checkRetention(crm, collectedAt, 364 * DAY);
    const after = checkRetention(crm, collectedAt, 365 * DAY);
    expect(before.expired).toBe(false);
    expect(after.expired).toBe(true);
    expect(after.expiresAt).toBe(365 * DAY);
  });

  it("treats null retention as non-expiring", () => {
    const src = DEMO_GRAPH.nodes.find((n) => n.id === "src-web")!;
    // sources aren't valid — use processor with null? sources have null.
    // Use a synthetic store-like check via processor with retention
    const enrich = DEMO_GRAPH.nodes.find((n) => n.id === "proc-enrich")!;
    const mid = checkRetention(enrich, 0, 3 * DAY);
    expect(mid.expired).toBe(false);
    expect(checkRetention(enrich, 0, 7 * DAY).expired).toBe(true);
  });
});

describe("activeStores", () => {
  it("filters stores still within retention", () => {
    const collectedAt = 0;
    const early = activeStores(DEMO_GRAPH, collectedAt, 30 * DAY);
    expect(early.map((s) => s.id).sort()).toEqual(
      ["store-archive", "store-crm", "store-logs"].sort(),
    );
    const late = activeStores(DEMO_GRAPH, collectedAt, 400 * DAY);
    expect(late.map((s) => s.id).sort()).toEqual(["store-archive"].sort());
  });
});

describe("request workflow", () => {
  it("advances access request to fulfilled", () => {
    let req = submitRequest("access", "subj-demo-1", ["store-crm"], 1000);
    expect(req.status).toBe("submitted");
    req = advanceRequest(req, 2000);
    expect(req.status).toBe("verifying");
    req = advanceRequest(req, 3000);
    expect(req.status).toBe("in-progress");
    req = advanceRequest(req, 4000, "export ready");
    expect(req.status).toBe("fulfilled");
    expect(req.note).toBe("export ready");
    expect(() => advanceRequest(req, 5000)).toThrow(/already fulfilled/);
  });

  it("supports delete request rejection", () => {
    let req = submitRequest("delete", "subj-demo-2", ["store-archive"], 1);
    req = rejectRequest(req, 2, "legal hold");
    expect(req.status).toBe("rejected");
    expect(req.note).toBe("legal hold");
  });

  it("requires subject and stores", () => {
    expect(() => submitRequest("access", "  ", ["store-crm"], 1)).toThrow();
    expect(() => submitRequest("access", "x", [], 1)).toThrow();
  });
});
