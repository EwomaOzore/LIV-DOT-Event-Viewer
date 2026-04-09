import type { EventDetail, ScenarioId } from './types';
import { MOCK_EVENTS } from './scenarios';

const DEFAULT_DELAY_MS = 450;

export async function mockFetchEventDetail(
  scenario: ScenarioId,
  options?: { delayMs?: number; signal?: AbortSignal; forceFailure?: boolean }
): Promise<EventDetail> {
  const { delayMs = DEFAULT_DELAY_MS, signal, forceFailure } = options ?? {};

  await delay(delayMs, signal);

  if (forceFailure || scenario === 'request_failed') {
    throw new Error('HTTP 503: upstream timeout');
  }

  if (scenario === 'loading_demo') {
    await delay(2500, signal);
    return MOCK_EVENTS.upcoming;
  }

  return MOCK_EVENTS[scenario];
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
