'use client';

import { useEffect, useState } from 'react';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
  'CNY', 'HKD', 'SGD', 'INR', 'KRW', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'TRY', 'ZAR', 'BRL',
  'MXN', 'IDR', 'MYR', 'PHP', 'THB', 'ILS', 'ISK',
] as const;

type Currency = (typeof CURRENCIES)[number];

export default function Converter() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState<Currency>('USD');
  const [to, setTo] = useState<Currency>('EUR');
  const [fetched, setFetched] = useState<{ pair: string; rate: number; date: string } | null>(null);
  const [errored, setErrored] = useState<{ pair: string; message: string } | null>(null);

  const pair = `${from}-${to}`;

  useEffect(() => {
    if (from === to) return;
    const controller = new AbortController();
    const currentPair = `${from}-${to}`;

    fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { rates: Record<string, number>; date: string }) => {
        const r = data.rates?.[to];
        if (typeof r !== 'number') throw new Error('Rate unavailable');
        setFetched({ pair: currentPair, rate: r, date: data.date });
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setErrored({
          pair: currentPair,
          message: e instanceof Error ? e.message : 'Failed to load rate',
        });
      });

    return () => controller.abort();
  }, [from, to]);

  const rate: number | null =
    from === to ? 1 : fetched?.pair === pair ? fetched.rate : null;
  const updated = from === to ? null : fetched?.pair === pair ? fetched.date : null;
  const error = errored?.pair === pair ? errored.message : null;
  const loading = from !== to && rate === null && !error;

  const numericAmount = Number(amount);
  const validAmount = amount !== '' && Number.isFinite(numericAmount) && numericAmount >= 0;
  const converted = validAmount && rate !== null ? numericAmount * rate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Currency Converter
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Live rates via Frankfurter
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Amount
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-lg text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
          />
        </label>

        <div className="flex items-end gap-2">
          <label className="block flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              From
            </span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as Currency)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={swap}
            aria-label="Swap currencies"
            className="mb-0.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ⇄
          </button>

          <label className="block flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              To
            </span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as Currency)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading rate…</p>
        ) : !validAmount ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter a valid amount</p>
        ) : converted !== null && rate !== null ? (
          <>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatMoney(converted, to)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              1 {from} = {rate.toFixed(4)} {to}
              {updated && ` · ${updated}`}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
