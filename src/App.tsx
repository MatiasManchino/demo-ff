import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/types/game';
import WelcomeScreen from '@/components/WelcomeScreen';
import HowToPlay from '@/components/HowToPlay';
import MainScreen from '@/components/MainScreen';
import AgentNegotiationScreen from '@/components/AgentNegotiationScreen';
import ClientQuoteScreen from '@/components/ClientQuoteScreen';
import GameOverScreen from '@/components/GameOverScreen';
import VictoryScreen from '@/components/VictoryScreen';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  const screen = useGameStore(s => s.screen);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {screen === GameScreen.Welcome && <WelcomeScreen />}
      {screen === GameScreen.HowToPlay && <HowToPlay />}
      {screen === GameScreen.Main && <MainScreen />}
      {screen === GameScreen.AgentNegotiation && <AgentNegotiationScreen />}
      {screen === GameScreen.ClientQuote && <ClientQuoteScreen />}
      {screen === GameScreen.GameOver && <GameOverScreen />}
      {screen === GameScreen.Victory && <VictoryScreen />}
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}

export default App;
