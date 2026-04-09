import type { EventDetail, ScenarioId } from './types';

const baseEvent = (): Omit<
  EventDetail,
  'phase' | 'access' | 'playback' | 'startsAt' | 'endsAt'
> => ({
  id: 'evt-demo-1',
  title: 'Neon Nights: DJ Collective',
  subtitle: 'Live from Warehouse District',
});

export const MOCK_EVENTS: Record<Exclude<ScenarioId, 'loading_demo' | 'request_failed'>, EventDetail> = {
  not_purchased: {
    ...baseEvent(),
    startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    phase: 'scheduled',
    access: { purchased: false, verification: 'none' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: false,
    },
  },
  verification_pending: {
    ...baseEvent(),
    startsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    phase: 'scheduled',
    access: { purchased: true, verification: 'pending' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: false,
    },
  },
  verification_failed: {
    ...baseEvent(),
    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    phase: 'scheduled',
    access: { purchased: true, verification: 'failed' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: false,
    },
  },
  upcoming: {
    ...baseEvent(),
    startsAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    phase: 'scheduled',
    access: { purchased: true, verification: 'verified' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: false,
    },
  },
  live_watch: {
    ...baseEvent(),
    startsAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    phase: 'live',
    access: { purchased: true, verification: 'verified' },
    playback: {
      liveStreamAvailable: true,
      replayAvailable: false,
    },
  },
  live_offline: {
    ...baseEvent(),
    startsAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    phase: 'live',
    access: { purchased: true, verification: 'verified' },
    playback: {
      liveStreamAvailable: false,
      liveUnavailableReason:
        'The broadcast is temporarily unavailable. We are reconnecting — pull to refresh in a moment.',
      replayAvailable: false,
    },
  },
  replay: {
    ...baseEvent(),
    startsAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    phase: 'ended',
    access: { purchased: true, verification: 'verified' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: true,
      replayDurationLabel: '2h 14m',
    },
  },
  ended_no_replay: {
    ...baseEvent(),
    startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    phase: 'ended',
    access: { purchased: true, verification: 'verified' },
    playback: {
      liveStreamAvailable: false,
      replayAvailable: false,
      liveUnavailableReason: 'Replay rights for this event have expired.',
    },
  },
};

/** Stable order for the assessment demo scenario picker */
export const SCENARIO_ORDER: ScenarioId[] = [
  'live_watch',
  'live_offline',
  'replay',
  'upcoming',
  'not_purchased',
  'verification_pending',
  'verification_failed',
  'ended_no_replay',
  'loading_demo',
  'request_failed',
];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  loading_demo: 'Loading (slow)',
  not_purchased: 'No access',
  verification_pending: 'Access pending',
  verification_failed: 'Verification failed',
  upcoming: 'Upcoming',
  live_watch: 'Live — watch',
  live_offline: 'Live — unavailable',
  replay: 'Replay',
  ended_no_replay: 'Ended — no replay',
  request_failed: 'Request error',
};
