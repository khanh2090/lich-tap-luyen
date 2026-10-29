import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { CATEGORIES } from "../lib/categories";
import { formatDay } from "../lib/dates";
import { formatDistance, formatMinutes } from "../lib/format";
import { nextMonday, parsePlan, readTable, resolveDate, TEMPLATE_CSV, type ParsedPlan } from "../lib/plan-import";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Category } from "../types";
import { Modal } from "./ui/Modal";

export function downloadTemplate() {
  // BOM so Excel opens the Vietnamese headers as UTF-8.
  const blob = new Blob(["﻿" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "giao-an-mau.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const ACCEPT = ".csv,.xlsx,.json,.txt,.tsv";

export function ImportPlanModal() {
  const { importOpen, setImportOpen, navigate, setScheduleView, setSelectedPlanId } = useUi();
  const { data, today, importPlan } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedPlan | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(nextMonday(today));
  const [replace, setReplace] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!importOpen) return;
    setFile(null);
    setParsed(null);
    setError("");
    setSaving(false);
    setStartDate(nextMonday(today));
  }, [importOpen, today]);

  const load = async (f: File) => {
    setFile(f);
    setParsed(null);
    setError("");
    setReading(true);
    setName(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
    try {
      const table = await readTable(f);
      const plan = parsePlan(table, { difficulty: data.profile.experience, durationMin: data.profile.preferredDurationMin });
      if (plan.rows.length === 0) throw new Error("No sessions found under the header row.");
      setParsed(plan);
    } catch (e) {
      setError((e as Error).message || "This file couldn't be read.");
    } finally {
      setReading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) load(f);
  };

  const preview = useMemo(() => {
    if (!parsed) return null;
    const rows = parsed.rows.map((r) => ({ ...r, resolved: resolveDate(r, startDate) }));
    const ok = rows.filter((r) => r.errors.length === 0 && r.resolved);
    const dates = ok.map((r) => r.resolved!).sort();
    const bySport = new Map<Category, { count: number; km: number; min: number }>();
    for (const r of ok) {
      const s = bySport.get(r.category) ?? { count: 0, km: 0, min: 0 };
      bySport.set(r.category, { count: s.count + 1, km: s.km + (r.distanceKm ?? 0), min: s.min + r.durationMin });
    }
    return {
      rows,
      ok,
      errors: rows.length - ok.length,
      warnings: ok.filter((r) => r.warnings.length).length,
      first: dates[0],
      last: dates[dates.length - 1],
      bySport: [...bySport.entries()].sort((a, b) => b[1].min - a[1].min),
    };
  }, [parsed, startDate]);

  const existing = data.plans.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  const close = () => setImportOpen(false);

  const submit = async () => {
    if (!preview || !file || !name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 150));
    const id = importPlan(
      { name: name.trim(), sourceFile: file.name },
      preview.ok.map((r) => ({
        title: r.title,
        category: r.category,
        date: r.resolved!,
        time: r.time,
        durationMin: r.durationMin,
        difficulty: r.difficulty,
        calories: r.calories,
        focus: r.focus,
        notes: r.notes,
        distanceKm: r.distanceKm,
        status: r.done ? "completed" : "scheduled",
      })),
      existing && replace ? existing.id : undefined,
    );
    close();
    setSelectedPlanId(id);
    setScheduleView("plan");
    navigate("schedule");
  };

  return (
    <Modal
      open={importOpen}
      onClose={close}
      size="lg"
      title="Import training plan"
      description="Add a whole plan at once from Excel (.xlsx), CSV or JSON. Every session lands on your calendar."
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!preview || preview.ok.length === 0 || !name.trim() || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Importing…" : preview ? `Import ${preview.ok.length} sessions` : "Import"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${file && !reading ? "py-4" : "py-8"} ${
            dragging ? "border-lime bg-lime/10" : "border-line hover:border-lime/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) load(f);
              e.target.value = "";
            }}
          />
          {reading ? <Loader2 className="size-8 animate-spin text-lime-ink" /> : file ? <FileSpreadsheet className="size-8 text-lime-ink" /> : <UploadCloud className="size-8 text-lime-ink" />}
          <p className="mt-3 font-semibold text-ink">{file ? file.name : "Drop your plan file here, or click to choose"}</p>
          <p className="mt-1 text-xs text-muted">
            {file ? "Click to pick a different file" : "Columns: Date — or Week + Day — plus Workout, Type, Duration, Distance, Intensity, Notes"}
          </p>
        </label>

        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          Not sure about the format?
          <button type="button" className="inline-flex items-center gap-1 font-semibold text-lime-ink hover:underline" onClick={downloadTemplate}>
            <Download className="size-4" /> Download the template
          </button>
          (open it in Excel, fill it in, save as .xlsx or CSV).
        </p>

        {error && (
          <div role="alert" className="flex gap-3 rounded-2xl bg-orange/10 p-4 text-sm text-ink">
            <XCircle className="mt-0.5 size-5 shrink-0 text-orange" />
            <p>{error}</p>
          </div>
        )}

        {preview && parsed && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="plan-name" className="field-label">
                  Plan name
                </label>
                <input
                  id="plan-name"
                  className="input"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!name.trim()}
                  aria-describedby={!name.trim() ? "plan-name-error" : undefined}
                />
                {!name.trim() && (
                  <p id="plan-name-error" className="mt-1.5 text-xs font-medium text-orange">
                    Give the plan a name.
                  </p>
                )}
              </div>
              {parsed.usesWeeks && (
                <div>
                  <label htmlFor="plan-start" className="field-label">
                    Week 1 starts on
                  </label>
                  <input id="plan-start" type="date" className="input" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
                  <p className="mt-1.5 text-xs text-muted">Sessions are placed by week and weekday from this Monday.</p>
                </div>
              )}
            </div>

            {existing && (
              <label className="flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
                <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-lime)]" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                <span>
                  <span className="font-semibold text-ink">Replace the existing “{existing.name}”</span>
                  <span className="block text-muted">Its sessions are removed first, so re-importing an edited file doesn't create duplicates.</span>
                </span>
              </label>
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="tag !bg-lime/15 !text-lime-ink">
                <CheckCircle2 className="size-3.5" /> {preview.ok.length} sessions ready
              </span>
              {preview.warnings > 0 && (
                <span className="tag !bg-orange/10 !text-ink">
                  <AlertTriangle className="size-3.5 text-orange" /> {preview.warnings} with notes
                </span>
              )}
              {preview.errors > 0 && (
                <span className="tag !bg-orange/15 !text-orange">
                  <XCircle className="size-3.5" /> {preview.errors} skipped
                </span>
              )}
              {parsed.restDays > 0 && <span className="tag">{parsed.restDays} rest {parsed.restDays === 1 ? "day" : "days"}</span>}
              {preview.first && (
                <span className="tag">
                  {formatDay(preview.first, { month: "short", day: "numeric", year: "numeric" })} → {formatDay(preview.last, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {preview.bySport.map(([cat, s]) => (
                <span key={cat} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: CATEGORIES[cat].color }} />
                  <span className="font-semibold text-ink">{CATEGORIES[cat].label}</span>
                  <span className="text-muted">
                    {s.count}× · {formatMinutes(s.min)}
                    {s.km > 0 && ` · ${formatDistance(s.km, data.profile.units)}`}
                  </span>
                </span>
              ))}
            </div>

            <div className="max-h-80 overflow-auto rounded-2xl border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-surface text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Row</th>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Session</th>
                    <th className="px-3 py-2 font-semibold">Duration</th>
                    <th className="px-3 py-2 font-semibold">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.rows.map((r) => (
                    <tr key={r.line} className={r.errors.length ? "bg-orange/5" : ""}>
                      <td className="px-3 py-2 text-muted">{r.line}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-ink">
                        {r.resolved ? formatDay(r.resolved, { weekday: "short", month: "short", day: "numeric" }) : "—"}
                        {r.time && <span className="text-muted"> · {r.time}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: CATEGORIES[r.category].color }} />
                          <span className="font-medium text-ink">{r.title}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted">
                        {r.durationMin} min{r.distanceKm ? ` · ${formatDistance(r.distanceKm, data.profile.units)}` : ""}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.errors.length ? (
                          <span className="text-orange">{r.errors.join("; ")}</span>
                        ) : r.warnings.length ? (
                          <span className="text-muted">{r.warnings.join("; ")}</span>
                        ) : (
                          <CheckCircle2 className="size-4 text-lime-ink" aria-label="OK" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
