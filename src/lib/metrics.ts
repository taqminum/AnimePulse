interface MetricSnapshot {
  counters: Record<string, number>;
  timings: Record<string, { count: number; totalMs: number; maxMs: number }>;
  startedAt: string;
}

const counters = new Map<string, number>();
const timings = new Map<string, { count: number; totalMs: number; maxMs: number }>();
const startedAt = new Date();

export const incrementMetric = (name: string, value = 1) => {
  counters.set(name, (counters.get(name) || 0) + value);
};

export const recordTiming = (name: string, durationMs: number) => {
  const current = timings.get(name) || { count: 0, totalMs: 0, maxMs: 0 };

  timings.set(name, {
    count: current.count + 1,
    totalMs: current.totalMs + durationMs,
    maxMs: Math.max(current.maxMs, durationMs),
  });
};

export const getMetricSnapshot = (): MetricSnapshot => ({
  counters: Object.fromEntries(counters),
  timings: Object.fromEntries(timings),
  startedAt: startedAt.toISOString(),
});

export const clearMetricsForTest = () => {
  counters.clear();
  timings.clear();
};
