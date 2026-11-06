// Player-facing copy for the server's error codes (server/game/constants.js).
const MESSAGES = {
  room_not_found: "There's no room with that code. Check the letters and try again.",
  room_full: 'That room is full (8 players).',
  game_in_progress: 'That game has already started. Ask the host to start a new one after this game.',
  invalid_name: 'Pick a name to play under.',
  not_host: 'Only the host can start the game.',
  wrong_phase: 'Hold on, the round has moved on.',
  already_solved: 'You already got this one.',
  rate_limited: 'Too many guesses at once. Take a breath.',
  invalid_session: 'Your seat in that room has expired. Join again with the code.',
  not_in_room: "You're not in a room any more.",
  no_questions: "Couldn't load any movies for this game. Try again.",
  bad_request: 'Something went wrong. Try again.',
  offline: "Can't reach the game server. Check your connection.",
  replaced: 'You opened this room in another tab, so this one stepped aside.',
};

export function errorMessage(code) {
  return MESSAGES[code] ?? MESSAGES.bad_request;
}
