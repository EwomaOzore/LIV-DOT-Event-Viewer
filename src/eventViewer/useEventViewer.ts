import * as Network from 'expo-network';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventDetail, ScenarioId } from './types';
import { mockFetchEventDetail } from './mockFetch';
import { deriveViewerPresentation, type FetchPhase } from './presentation';

export function useEventViewer(scenario: ScenarioId) {
  const [fetchPhase, setFetchPhase] = useState<FetchPhase>('loading');
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | undefined>();
  const [isOnline, setIsOnline] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const forceFailureRef = useRef(false);

  useEffect(() => {
    const sub = Network.addNetworkStateListener((state) => {
      const connected =
        state.isConnected === true &&
        (state.isInternetReachable === true || state.isInternetReachable === null);
      setIsOnline(connected);
    });
    Network.getNetworkStateAsync().then((state) => {
      const connected =
        state.isConnected === true &&
        (state.isInternetReachable === true || state.isInternetReachable === null);
      setIsOnline(connected);
    });
    return () => sub.remove();
  }, []);

  const load = useCallback(
    async (clearEvent: boolean) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      if (clearEvent) {
        setEvent(null);
      }
      setFetchPhase('loading');
      setRequestErrorMessage(undefined);
      const forceFail = forceFailureRef.current;
      forceFailureRef.current = false;
      try {
        const data = await mockFetchEventDetail(scenario, {
          signal: ac.signal,
          forceFailure: forceFail,
        });
        if (!ac.signal.aborted) {
          setEvent(data);
          setFetchPhase('success');
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!ac.signal.aborted) {
          setRequestErrorMessage(msg);
          if (clearEvent) {
            setEvent(null);
          }
          setFetchPhase('error');
        }
      }
    },
    [scenario]
  );

  useEffect(() => {
    load(true);
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const presentation = useMemo(
    () =>
      deriveViewerPresentation({
        event,
        fetchPhase,
        isOnline,
        simulateOffline,
        requestErrorMessage,
      }),
    [event, fetchPhase, isOnline, simulateOffline, requestErrorMessage]
  );

  const simulateFailedRefresh = useCallback(() => {
    forceFailureRef.current = true;
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  return {
    presentation,
    refresh,
    isRefreshing: fetchPhase === 'loading' && event !== null,
    simulateOffline,
    setSimulateOffline,
    simulateFailedRefresh,
    isOnline,
  };
}
