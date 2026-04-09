import type { EventDetail, ViewerPresentation } from './types';

export type FetchPhase = 'idle' | 'loading' | 'success' | 'error';

function deriveFromEvent(event: EventDetail): ViewerPresentation {
  if (!event.access.purchased) {
    return { kind: 'need_purchase', event };
  }

  if (event.access.verification === 'pending') {
    return { kind: 'verification_pending', event };
  }

  if (event.access.verification === 'failed') {
    return { kind: 'verification_failed', event };
  }

  if (event.phase === 'scheduled') {
    return { kind: 'upcoming', event };
  }

  if (event.phase === 'live') {
    if (event.playback.liveStreamAvailable) {
      return { kind: 'live_ready', event };
    }
    return {
      kind: 'live_unavailable',
      event,
      reason:
        event.playback.liveUnavailableReason ??
        'Live video is not available right now. Try again shortly or contact support if this continues.',
    };
  }

  if (event.playback.replayAvailable) {
    return { kind: 'replay', event };
  }

  return { kind: 'ended_no_replay', event };
}

export function deriveViewerPresentation(params: {
  event: EventDetail | null;
  fetchPhase: FetchPhase;
  isOnline: boolean;
  simulateOffline: boolean;
  requestErrorMessage?: string;
}): ViewerPresentation {
  const { event, fetchPhase, isOnline, simulateOffline, requestErrorMessage } = params;

  const offline = simulateOffline || isOnline === false;

  if (offline && fetchPhase !== 'success' && !event) {
    return {
      kind: 'offline',
      message:
        'No internet connection. Check your network and try again — purchases and playback require a stable connection.',
    };
  }

  if (fetchPhase === 'loading' && !event) {
    return { kind: 'loading' };
  }

  if (fetchPhase === 'error') {
    return {
      kind: 'request_failed',
      message:
        requestErrorMessage ??
        'We could not load this event. The server may be busy or your connection was interrupted.',
    };
  }

  if (!event) {
    return {
      kind: 'request_failed',
      message: 'Event data was missing. Please go back and open the event again.',
    };
  }

  return deriveFromEvent(event);
}
