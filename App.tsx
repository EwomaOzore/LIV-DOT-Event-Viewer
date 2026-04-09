import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventViewerScreen } from './src/screens/EventViewerScreen';
import type { ScenarioId } from './src/eventViewer/types';

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>('live_watch');

  return (
    <SafeAreaProvider>
      <EventViewerScreen scenario={scenario} onChangeScenario={setScenario} />
    </SafeAreaProvider>
  );
}
