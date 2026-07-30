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
    <div className="w-full max-w-sm mx-auto mt-4 px-2">
      <div className="editorial-card rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm">
        {/* Header Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-[#F5F2EB]/80 hover:bg-[#F0ECDF] transition-colors duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-stone-700 fill-stone-700" />
            <span className="text-xs font-serif font-medium text-stone-900">
              Session Stats & Picks
            </span>
            {commonLikes.length > 0 && (
              <span className="bg-stone-200 text-stone-800 border border-stone-300/80 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-stone-700" />
                {commonLikes.length} {commonLikes.length === 1 ? 'Match' : 'Matches'}
              </span>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4 text-stone-500" /> : <ChevronUp className="w-4 h-4 text-stone-500" />}
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-4 space-y-4 border-t border-stone-200/80 text-xs">
            {/* Matches List */}
            {commonLikes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-serif text-sm text-stone-900 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                  <span>Matched Movies ({commonLikes.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {commonLikes.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-xl p-1.5 pr-3 text-stone-800"
                    >
                      <img src={m.poster_path} alt={m.title} className="w-6 h-9 object-cover rounded-md border border-stone-300" />
                      <span className="font-sans font-medium text-xs truncate max-w-[120px]">{m.title}</span>
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
