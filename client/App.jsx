import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import BuilderScreen from './components/BuilderScreen.jsx';
import FinishedScreen from './components/FinishedScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import LobbyScreen from './components/LobbyScreen.jsx';
import QuestionScreen from './components/QuestionScreen.jsx';

const identityKey = 'quiz-live-identity';
const socket = io({ autoConnect: false });

function readIdentity() {
  try {
    return JSON.parse(localStorage.getItem(identityKey) || 'null');
  } catch {
    return null;
  }
}

export default function App() {
  const [identity, setIdentity] = useState(readIdentity);
  const [roomState, setRoomState] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const identityRef = useRef(identity);
  const toastTimer = useRef(0);

  useEffect(() => {
    identityRef.current = identity;
    if (identity) localStorage.setItem(identityKey, JSON.stringify(identity));
    else localStorage.removeItem(identityKey);
  }, [identity]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3600);
  }, []);

  const emit = useCallback((event, payload) => new Promise((resolve) => {
    socket.timeout(35_000).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) {
        showToast('The server timed out. Please try again.');
        resolve(null);
        return;
      }
      if (!response?.ok) {
        showToast(response?.error || 'This action could not be completed.');
        resolve(null);
        return;
      }
      resolve(response);
    });
  }), [showToast]);

  const returnHome = useCallback(() => {
    setIdentity(null);
    setRoomState(null);
    setBuilderOpen(false);
    window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    const resumeRoom = async () => {
      const currentIdentity = identityRef.current;
      if (!currentIdentity) return;
      const event = currentIdentity.role === 'host' ? 'host:resume' : 'player:resume';
      const payload = currentIdentity.role === 'host'
        ? { code: currentIdentity.code, hostToken: currentIdentity.token }
        : { code: currentIdentity.code, playerToken: currentIdentity.token };
      if (!await emit(event, payload)) returnHome();
    };
    const onDisconnect = () => showToast('Connection lost. Trying to reconnect…');
    const onConnectError = () => showToast('Could not connect to the server. Check your internet connection.');
    const onRoomState = (state) => {
      setRoomState(state);
      window.history.replaceState(null, '', `/?room=${encodeURIComponent(state.code)}`);
    };
    const onRoomClosed = () => {
      returnHome();
      showToast('The host closed the room.');
    };

    socket.on('connect', resumeRoom);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room:state', onRoomState);
    socket.on('room:closed', onRoomClosed);
    socket.connect();
    return () => {
      socket.off('connect', resumeRoom);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room:state', onRoomState);
      socket.off('room:closed', onRoomClosed);
      socket.disconnect();
      window.clearTimeout(toastTimer.current);
    };
  }, [emit, returnHome, showToast]);

  const setRoomIdentity = (role, code, token) => {
    setIdentity({ role, code, token });
    setRoomState(null);
    setBuilderOpen(false);
    window.history.replaceState(null, '', `/?room=${encodeURIComponent(code)}`);
  };

  const joinRoom = async (code, name) => {
    const response = await emit('player:join', { code: code.toUpperCase(), name });
    if (response) setRoomIdentity('player', response.code, response.playerToken);
  };

  const createRoom = async (questionCount) => {
    setIsGenerating(true);
    try {
      const response = await emit('host:create', { questionCount });
      if (response) setRoomIdentity('host', response.code, response.hostToken);
    } finally {
      setIsGenerating(false);
    }
  };

  const leaveRoom = async () => {
    if (identity && !await emit('room:leave', { code: identity.code })) return;
    returnHome();
  };

  const startQuiz = () => emit('quiz:start', { code: identity.code });
  const nextQuestion = async () => {
    setIsGenerating(true);
    try {
      await emit('quiz:next', { code: identity.code });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async (answerIndex) => {
    await emit('player:answer', {
      code: identity.code,
      playerToken: identity.token,
      answerIndex
    });
  };

  let screen;
  if (identity && roomState) {
    if (roomState.phase === 'lobby') {
      screen = <LobbyScreen room={roomState} isHost={identity.role === 'host'} onStart={startQuiz} onLeave={leaveRoom} onToast={showToast} />;
    } else if (roomState.phase === 'finished') {
      screen = <FinishedScreen room={roomState} onHome={leaveRoom} />;
    } else {
      screen = <QuestionScreen
        room={roomState}
        isHost={identity.role === 'host'}
        isGenerating={isGenerating}
        onNext={nextQuestion}
        onAnswer={submitAnswer}
      />;
    }
  } else if (builderOpen) {
    screen = <BuilderScreen onBack={() => setBuilderOpen(false)} onCreate={createRoom} isGenerating={isGenerating} />;
  } else {
    screen = <HomeScreen
      roomFromUrl={new URLSearchParams(window.location.search).get('room') || ''}
      onOpenBuilder={() => setBuilderOpen(true)}
      onJoin={joinRoom}
    />;
  }

  return <>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Quiz Live home">
        <span className="brand-mark">Q</span>
        <span>quiz<span className="brand-accent">live</span></span>
      </a>
      <div className="topbar-note"><span className="online-dot"></span> Play together, wherever you are</div>
    </header>
    <main className="main-content" aria-live="polite">{screen}</main>
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="assertive">{toast}</div>
    <footer className="footer">Free live quiz <span>·</span> No account or installation needed</footer>
  </>;
}
