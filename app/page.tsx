"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type CustodyGraph,
  type SubjectRequest,
  checkRetention,
  nodesByKind,
} from "@/lib/custody";
import styles from "./page.module.css";

const DAY = 24 * 60 * 60 * 1000;
const COLLECTED = Date.UTC(2024, 0, 1);

const POS: Record<string, { x: number; y: number }> = {
  "src-web": { x: 8, y: 18 },
  "src-support": { x: 8, y: 55 },
  "proc-enrich": { x: 36, y: 36 },
  "proc-analytics": { x: 58, y: 18 },
  "store-crm": { x: 58, y: 55 },
  "store-logs": { x: 82, y: 18 },
  "store-archive": { x: 82, y: 62 },
};

export default function HomePage() {
  const [graph, setGraph] = useState<CustodyGraph | null>(null);
  const [asOfDays, setAsOfDays] = useState(100);
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [subject, setSubject] = useState("subj-demo-ada");
  const [storeId, setStoreId] = useState("store-crm");
  const [reqType, setReqType] = useState<"access" | "delete">("access");
  const [status, setStatus] = useState("Loading custody map from disk…");
  const [selectedId, setSelectedId] = useState<string | null>("store-crm");

  async function refresh() {
    const response = await fetch("/api/custody");
    const body = (await response.json()) as {
      data: { graph: CustodyGraph; requests: SubjectRequest[] };
    };
    setGraph(body.data.graph);
    setRequests(body.data.requests);
    setStatus(`${body.data.requests.length} requests in data/custody.json`);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const asOf = COLLECTED + asOfDays * DAY;
  const stores = graph ? nodesByKind(graph, "store") : [];
  const selected = graph?.nodes.find((n) => n.id === selectedId) ?? graph?.nodes[0];

  const retentionRows = useMemo(() => {
    if (!graph) return [];
    return [...nodesByKind(graph, "processor"), ...stores].map((n) =>
      checkRetention(n, COLLECTED, asOf),
    );
  }, [asOf, graph, stores]);

  const submit = async () => {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: reqType, subjectRef: subject, storeIds: [storeId] }),
    });
    const body = (await response.json()) as { data?: SubjectRequest; error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Submit failed");
      return;
    }
    await refresh();
  };

  const advance = async (id: string) => {
    const response = await fetch(`/api/requests/${id}/advance`, { method: "POST" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Advance failed");
      return;
    }
    await refresh();
  };

  const reject = async (id: string) => {
    const response = await fetch(`/api/requests/${id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: "policy hold (demo)" }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Reject failed");
      return;
    }
    await refresh();
  };

  if (!graph) {
    return (
      <main className={styles.shell}>
        <p>{status}</p>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>PERSONAL-DATA ATLAS · SYNTHETIC</p>
        <h1>CustodyMap</h1>
        <p className={styles.lede}>
          Trace how demo data moves from sources through processors into stores.
          Inspect retention expiry and rehearse access or delete requests. {status}
        </p>
      </header>

      <section className={styles.mapWrap}>
        <svg className={styles.map} viewBox="0 0 100 80" role="img" aria-label="Custody flow map">
          <defs>
            <marker
              id="arrow"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--route)" />
            </marker>
          </defs>
          {graph.edges.map((e) => {
            const a = POS[e.from];
            const b = POS[e.to];
            return (
              <line
                key={e.id}
                x1={a.x + 6}
                y1={a.y + 4}
                x2={b.x}
                y2={b.y + 4}
                stroke="var(--route)"
                strokeWidth="0.4"
                markerEnd="url(#arrow)"
                opacity="0.85"
              />
            );
          })}
          {graph.nodes.map((n) => {
            const p = POS[n.id];
            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                onClick={() => setSelectedId(n.id)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width="14"
                  height="10"
                  rx="0.8"
                  className={
                    n.kind === "source"
                      ? styles.kindSource
                      : n.kind === "processor"
                        ? styles.kindProcessor
                        : styles.kindStore
                  }
                  opacity={selectedId === n.id ? 1 : 0.82}
                  stroke={selectedId === n.id ? "var(--route)" : "none"}
                  strokeWidth={selectedId === n.id ? 0.45 : 0}
                />
                <text x="7" y="4.2" textAnchor="middle" className={styles.nodeLabel}>
                  {n.kind.slice(0, 3).toUpperCase()}
                </text>
                <text x="7" y="7.6" textAnchor="middle" className={styles.nodeName}>
                  {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className={styles.legend}>
          <span data-k="source">Source</span>
          <span data-k="processor">Processor</span>
          <span data-k="store">Store</span>
        </div>
        {selected ? (
          <p className={styles.nodeDetail}>
            <strong>{selected.label}</strong> · {selected.kind} · {selected.region} ·{" "}
            {selected.purpose}
            {selected.retentionDays != null ? ` · ${selected.retentionDays}d retention` : " · ephemeral"}
          </p>
        ) : null}
      </section>

      <div className={styles.split}>
        <section className={styles.panel}>
          <h2>Retention survey</h2>
          <label className={styles.slider}>
            Days since collection: {asOfDays}
            <input
              type="range"
              min={0}
              max={800}
              value={asOfDays}
              onChange={(e) => setAsOfDays(Number(e.target.value))}
            />
          </label>
          <ul className={styles.retain}>
            {retentionRows.map((row) => {
              const node = graph.nodes.find((n) => n.id === row.storeId)!;
              return (
                <li key={row.storeId} data-expired={row.expired ? "yes" : "no"}>
                  <strong>{node.label}</strong>
                  <span>
                    {row.retentionDays == null
                      ? "no fixed retention"
                      : `${row.retentionDays}d · ${row.expired ? "expired" : "active"}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2>Subject request desk</h2>
          <div className={styles.form}>
            <label>
              Subject ref
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label>
              Type
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as "access" | "delete")}
              >
                <option value="access">access</option>
                <option value="delete">delete</option>
              </select>
            </label>
            <label>
              Store
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={styles.primary} onClick={() => void submit()}>
              Submit request
            </button>
          </div>

          <ul className={styles.reqs}>
            {requests.length === 0 ? (
              <li className={styles.emptyReq}>
                No subject requests yet. Submit an access or delete rehearsal to start the desk.
              </li>
            ) : (
              requests.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>
                    {r.type} · {r.status}
                  </strong>
                  <span>
                    {r.subjectRef} → {r.storeIds.join(", ")}
                  </span>
                  {r.note ? <em>{r.note}</em> : null}
                </div>
                <div className={styles.reqActions}>
                  {r.status !== "fulfilled" && r.status !== "rejected" ? (
                    <>
                      <button type="button" onClick={() => void advance(r.id)}>
                        Advance
                      </button>
                      <button type="button" onClick={() => void reject(r.id)}>
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <footer className={styles.foot}>
        Saeed Rumaneh · CustodyMap MVP · synthetic flows only — see SECURITY.md
      </footer>
    </main>
  );
}
