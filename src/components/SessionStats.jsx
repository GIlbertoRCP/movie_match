import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { Heart, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export default function SessionStats() {
  const { p1Likes, p2Likes, deck, phase, mode } = useMovieContext();
  const [isOpen, setIsOpen] = useState(false);

  const p1LikedMovies = deck.filter(m => p1Likes.includes(m.id));
  const p2LikedMovies = deck.filter(m => p2Likes.includes(m.id));

  // Find all matched movies between P1 and P2
  const commonLikes = deck.filter(m => p1Likes.includes(m.id) && p2Likes.includes(m.id));

  if (p1Likes.length === 0 && p2Likes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-4 px-4 pb-6">
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        {/* Header Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Session Stats & Picks
            </span>
            {commonLikes.length > 0 && (
              <span className="bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {commonLikes.length} {commonLikes.length === 1 ? 'Match' : 'Matches'}
              </span>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-4 space-y-4 border-t border-slate-800 text-xs">
            {/* Matches List */}
            {commonLikes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Matched Movies ({commonLikes.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {commonLikes.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 bg-purple-950/60 border border-purple-800/60 rounded-xl p-1.5 pr-3 text-purple-200"
                    >
                      <img src={m.poster_path} alt={m.title} className="w-6 h-9 object-cover rounded-md" />
                      <span className="font-bold truncate max-w-[120px]">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player 1 Likes */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Player 1 Picks ({p1LikedMovies.length})
              </h4>
              {p1LikedMovies.length === 0 ? (
                <p className="text-slate-500 italic">No likes yet</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {p1LikedMovies.map(m => (
                    <span
                      key={m.id}
                      className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg text-[11px] font-medium"
                    >
                      {m.title}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Player 2 Likes (if active or finished) */}
            {(phase === 'p2_swiping' || phase === 'matched' || p2Likes.length > 0) && (
              <div className="space-y-1.5 border-t border-slate-800/60 pt-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Player 2 Picks ({p2LikedMovies.length})
                </h4>
                {p2LikedMovies.length === 0 ? (
                  <p className="text-slate-500 italic">No likes yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {p2LikedMovies.map(m => (
                      <span
                        key={m.id}
                        className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg text-[11px] font-medium"
                      >
                        {m.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
