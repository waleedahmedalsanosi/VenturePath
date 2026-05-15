"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

export function AuditFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [entity, setEntity] = useState(params.get("entity") ?? "all");
  const [actor, setActor] = useState(params.get("actor") ?? "");
  const [since, setSince] = useState(params.get("since") ?? "");
  const [until, setUntil] = useState(params.get("until") ?? "");

  function apply() {
    const u = new URLSearchParams();
    if (entity && entity !== "all") u.set("entity", entity);
    if (actor) u.set("actor", actor);
    if (since) u.set("since", since);
    if (until) u.set("until", until);
    const qs = u.toString();
    router.push(qs ? `/audit?${qs}` : "/audit");
  }

  function clear() {
    setEntity("all");
    setActor("");
    setSince("");
    setUntil("");
    router.push("/audit");
  }

  return (
    <section className="rounded-xl bg-(--color-surface-container-low) p-6">
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
        Filters
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Entity
          </span>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className={inputClass}
          >
            <option value="all">All</option>
            <option value="workspace">Workspace</option>
            <option value="shareholder">Shareholder</option>
            <option value="document">Document</option>
            <option value="compliance_obligation">Compliance</option>
          </select>
        </label>
        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Actor email contains
          </span>
          <input
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="e.g. founder@"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Since
          </span>
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Until
          </span>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          className="btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg ghost-border px-5 py-2 text-label-lg hover:bg-(--color-surface-container-high)"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
