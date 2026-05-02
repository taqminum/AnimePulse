import { beforeEach, describe, expect, it } from 'vitest';
import { clearMetricsForTest, getMetricSnapshot, incrementMetric, recordTiming } from './metrics';

describe('metrics', () => {
  beforeEach(() => {
    clearMetricsForTest();
  });

  it('increments counters', () => {
    incrementMetric('api.test');
    incrementMetric('api.test', 2);

    expect(getMetricSnapshot().counters['api.test']).toBe(3);
  });

  it('records timing aggregates', () => {
    recordTiming('api.duration_ms', 10);
    recordTiming('api.duration_ms', 30);

    expect(getMetricSnapshot().timings['api.duration_ms']).toEqual({
      count: 2,
      totalMs: 40,
      maxMs: 30,
    });
  });
});
