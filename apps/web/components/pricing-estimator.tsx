"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@fyxvo/ui";
import { PRICING_LAMPORTS, VOLUME_DISCOUNT, FREE_TIER_REQUESTS, applyVolumeDiscount } from "@fyxvo/config";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface Props {
  readonly solPriceUsd: number | null;
}

function estimateCost(input: {
  monthly: number;
  standardPct: number;
  computeHeavyPct: number;
  priorityPct: number;
  solPriceUsd: number | null;
}) {
  const { monthly, standardPct, computeHeavyPct, priorityPct, solPriceUsd } = input;
  const standardCount = Math.round(monthly * standardPct / 100);
  const computeHeavyCount = Math.round(monthly * computeHeavyPct / 100);
  const priorityCount = Math.round(monthly * priorityPct / 100);

  const stdPrice = applyVolumeDiscount(PRICING_LAMPORTS.standard, monthly);
  const chPrice = applyVolumeDiscount(PRICING_LAMPORTS.computeHeavy, monthly);
  const priPrice = applyVolumeDiscount(PRICING_LAMPORTS.priority, monthly);

  const totalLamports = stdPrice * standardCount + chPrice * computeHeavyCount + priPrice * priorityCount;
  const totalSol = totalLamports / LAMPORTS_PER_SOL;
  const totalUsd = solPriceUsd != null ? totalSol * solPriceUsd : null;

  const discountPct = monthly >= VOLUME_DISCOUNT.tier2.monthlyRequests
    ? VOLUME_DISCOUNT.tier2.discountBps / 100
    : monthly >= VOLUME_DISCOUNT.tier1.monthlyRequests
      ? VOLUME_DISCOUNT.tier1.discountBps / 100
      : 0;

  return { totalLamports, totalSol, totalUsd, discountPct, stdPrice, chPrice, priPrice };
}

export function PricingEstimator({ solPriceUsd }: Props) {
  const [monthly, setMonthly] = useState(100_000);
  const [standardPct, setStandardPct] = useState(70);
  const [computeHeavyPct, setComputeHeavyPct] = useState(20);
  const priorityPct = Math.max(0, 100 - standardPct - computeHeavyPct);

  const result = estimateCost({ monthly, standardPct, computeHeavyPct, priorityPct, solPriceUsd });
  const freeRemaining = Math.max(0, FREE_TIER_REQUESTS - monthly);

  return (
    <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
      <CardHeader>
        <CardTitle>Cost estimator</CardTitle>
        <CardDescription>Adjust request volume and method mix to estimate monthly SOL spend.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Monthly requests: <span className="font-medium text-[var(--fyxvo-text)]">{monthly.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={1000}
              max={50_000_000}
              step={1000}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Standard reads: <span className="font-medium text-[var(--fyxvo-text)]">{standardPct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={standardPct}
              onChange={(e) => {
                const v = Number(e.target.value);
                setStandardPct(v);
                if (v + computeHeavyPct > 100) setComputeHeavyPct(100 - v);
              }}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Compute-heavy: <span className="font-medium text-[var(--fyxvo-text)]">{computeHeavyPct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100 - standardPct}
              step={5}
              value={computeHeavyPct}
              onChange={(e) => setComputeHeavyPct(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <p className="text-xs text-[var(--fyxvo-text-muted)]">Priority relay: {priorityPct}% (remainder)</p>
        </div>

        <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--fyxvo-text-muted)]">Monthly lamports</span>
            <span className="font-mono text-sm text-[var(--fyxvo-text)]">{result.totalLamports.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--fyxvo-text-muted)]">Monthly SOL</span>
            <span className="font-mono text-sm font-semibold text-[var(--fyxvo-text)]">{result.totalSol.toFixed(6)} SOL</span>
          </div>
          {result.totalUsd != null ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fyxvo-text-muted)]">Est. USD</span>
              <span className="font-mono text-sm text-[var(--fyxvo-text-soft)]">~${result.totalUsd.toFixed(2)}</span>
            </div>
          ) : null}
          {result.discountPct > 0 ? (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs">Volume discount applied</span>
              <span className="text-xs font-medium">−{result.discountPct}%</span>
            </div>
          ) : null}
          {freeRemaining > 0 ? (
            <div className="text-xs text-emerald-600 dark:text-emerald-400">
              {freeRemaining.toLocaleString()} of your {FREE_TIER_REQUESTS.toLocaleString()} free requests remain for new projects.
            </div>
          ) : null}
        </div>

        <div className="text-xs text-[var(--fyxvo-text-muted)] space-y-1">
          <p>Effective rates at this volume: {result.stdPrice} lam/std · {result.chPrice} lam/compute-heavy · {result.priPrice} lam/priority</p>
          {solPriceUsd != null ? (
            <p>SOL price used: ${solPriceUsd.toFixed(2)} (live from CoinGecko)</p>
          ) : (
            <p>USD estimate unavailable — SOL price could not be fetched.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
