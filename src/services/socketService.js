import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.activeSessionId = null;
    this.activeRole = 'p1';
    this.heartbeatTimer = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
      });

      this.socket.on('connect', () => {
        console.log('⚡ Connected to Movie Match WebSockets:', this.socket.id);
        // Automatically re-join session and recover state if reconnected after network drop
        if (this.activeSessionId) {
          console.log('🔄 Auto-rejoining session following socket reconnection:', this.activeSessionId);
          this.socket.emit('join_session', { sessionId: this.activeSessionId, role: this.activeRole });
          this.requestStateRecovery(this.activeSessionId);
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`📡 Socket reconnected on attempt #${attemptNumber}`);
        if (this.activeSessionId) {
          this.socket.emit('join_session', { sessionId: this.activeSessionId, role: this.activeRole });
          this.requestStateRecovery(this.activeSessionId);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ WebSockets disconnected:', reason);
      });
    }
    return this.socket;
  }

  joinSession(sessionId, role = 'p1') {
    this.activeSessionId = sessionId;
    this.activeRole = role;
    const s = this.connect();
    s.emit('join_session', { sessionId, role });
    this.startHeartbeat(sessionId);
  }

  leaveSession(sessionId, role = 'p1') {
    this.stopHeartbeat();
    const s = this.connect();
    s.emit('leave_session', { sessionId, role });
    this.activeSessionId = null;
  }

  requestStateRecovery(sessionId) {
    if (!sessionId) return;
    const s = this.connect();
    s.emit('recover_state', { sessionId, role: this.activeRole });
  }

  sendSwipe(sessionId, player, movieId, isLike, movie = null) {
    const s = this.connect();
    s.emit('swipe_card', { sessionId, player, movieId, isLike, movie });
  }

  startHeartbeat(sessionId) {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected && this.activeSessionId) {
        this.socket.emit('ping_room', { sessionId: this.activeSessionId, role: this.activeRole });
      }
    }, 15000); // Send heartbeat every 15 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  onSessionTerminated(callback) {
    const s = this.connect();
    s.on('session_terminated', callback);
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

  onStateRecovered(callback) {
    const s = this.connect();
    s.on('state_recovered', callback);
  }

  onPartnerPresenceChanged(callback) {
    const s = this.connect();
    s.on('partner_presence', callback);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeSessionId = null;
  }
}

export const socketService = new SocketService();
export default socketService;
