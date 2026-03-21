"use client";

import { useEffect, useState } from "react";

const LINES = [
  { delay: 0,    text: "$ curl -X POST https://rpc.fyxvo.com/rpc \\", color: "text-[var(--fyxvo-text)]" },
  { delay: 200,  text: '  -H "content-type: application/json" \\', color: "text-[var(--fyxvo-text)]" },
  { delay: 400,  text: '  -H "x-api-key: fyxvo_live_abcd1234" \\', color: "text-[var(--fyxvo-text)]" },
  { delay: 600,  text: "  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSlot\"}'", color: "text-[var(--fyxvo-text)]" },
  { delay: 1000, text: "", color: "" },
  { delay: 1100, text: "{", color: "text-[var(--fyxvo-text-soft)]" },
  { delay: 1200, text: '  "jsonrpc": "2.0",', color: "text-[var(--fyxvo-text-soft)]" },
  { delay: 1300, text: '  "result": 284971823,', color: "text-emerald-400" },
  { delay: 1400, text: '  "id": 1', color: "text-[var(--fyxvo-text-soft)]" },
  { delay: 1500, text: "}", color: "text-[var(--fyxvo-text-soft)]" },
  { delay: 2000, text: "", color: "" },
  { delay: 2100, text: "# 42ms · 200 OK · devnet slot", color: "text-[var(--fyxvo-text-muted)]" },
];

const LOOP_INTERVAL = 8000; // Reset and replay every 8 seconds

// Combined state avoids a synchronous setState() call inside the effect body.
type AnimState = { count: number; generation: number };

export function AnimatedTerminal() {
  const [{ count, generation }, setState] = useState<AnimState>({ count: 0, generation: 0 });

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(
        () => setState((s) => ({ ...s, count: i + 1 })),
        line.delay + 400
      )
    );
    const loopTimer = setTimeout(() => {
      timers.forEach(clearTimeout);
      // Atomically reset count and bump generation — no synchronous setState in effect body
      setState((s) => ({ count: 0, generation: s.generation + 1 }));
    }, LOOP_INTERVAL);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loopTimer);
    };
  }, [generation]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel)] shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-500/70" />
        <span className="h-3 w-3 rounded-full bg-amber-500/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 font-mono text-xs text-[var(--fyxvo-text-muted)]">fyxvo terminal</span>
      </div>
      {/* Content */}
      <div className="min-h-[220px] p-5 font-mono text-sm leading-6">
        {LINES.slice(0, count).map((line, i) => (
          <div key={i} className={`${line.color} whitespace-pre`}>
            {line.text}
          </div>
        ))}
        {count < LINES.length && (
          <span className="inline-block h-4 w-2 animate-pulse bg-[var(--fyxvo-brand)] opacity-70" />
        )}
      </div>
    </div>
  );
}
