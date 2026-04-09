export type EventPhase = 'scheduled' | 'live' | 'ended';

export type AccessVerification = 'none' | 'pending' | 'verified' | 'failed';

export type EventDetail = {
  id: string;
  title: string;
  subtitle: string;
  startsAt: string;
  endsAt?: string;
  phase: EventPhase;
  access: {
    purchased: boolean;
    verification: AccessVerification;
  };
  playback: {
    liveStreamAvailable: boolean;
    liveUnavailableReason?: string;
    replayAvailable: boolean;
    replayDurationLabel?: string;
  };
};

export type ViewerPresentation =
  | { kind: 'loading' }
  | { kind: 'offline'; message: string }
  | { kind: 'request_failed'; message: string }
  | { kind: 'need_purchase'; event: EventDetail }
  | { kind: 'verification_pending'; event: EventDetail }
  | { kind: 'verification_failed'; event: EventDetail }
  | { kind: 'upcoming'; event: EventDetail }
  | { kind: 'live_ready'; event: EventDetail }
  | { kind: 'live_unavailable'; event: EventDetail; reason: string }
  | { kind: 'replay'; event: EventDetail }
  | { kind: 'ended_no_replay'; event: EventDetail };

export type ScenarioId =
  | 'loading_demo'
  | 'not_purchased'
  | 'verification_pending'
  | 'verification_failed'
  | 'upcoming'
  | 'live_watch'
  | 'live_offline'
  | 'replay'
  | 'ended_no_replay'
  | 'request_failed';
