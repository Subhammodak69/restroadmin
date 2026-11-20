import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function useAdminRealtime(token) {
  const [revision, setRevision] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  useEffect(() => {
    if (!token) { setConnected(false); return undefined; }
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    let eventSequence = 0;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.onAny((event, ...args) => {
      setRevision(value => value + 1);
      setLastEvent({ event, payload: args[0] || {}, sequence: ++eventSequence });
    });
    return () => { socket.disconnect(); setConnected(false); };
  }, [token]);
  return { revision, connected, lastEvent };
}
