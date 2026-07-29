import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('⚡ Connected to Movie Match WebSockets:', this.socket.id);
      });
    }
    return this.socket;
  }

  joinSession(sessionId, role = 'p1') {
    const s = this.connect();
    s.emit('join_session', { sessionId, role });
  }

  sendSwipe(sessionId, player, movieId, isLike) {
    const s = this.connect();
    s.emit('swipe_card', { sessionId, player, movieId, isLike });
  }

  onMatchFound(callback) {
    const s = this.connect();
    s.on('match_found', callback);
  }

  onSessionUpdated(callback) {
    const s = this.connect();
    s.on('session_updated', callback);
  }

  onParticipantJoined(callback) {
    const s = this.connect();
    s.on('participant_joined', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
