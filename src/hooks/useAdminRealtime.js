import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function useAdminRealtime(token) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    const changed = () => setRevision((value) => value + 1);
    socket.onAny(changed);
    return () => socket.disconnect();
  }, [token]);
  return revision;
}
