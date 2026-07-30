import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { copyToClipboard } from '../utils/urlState';
import { Radio, Share2, Check, Users, Sparkles, Copy, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnlineSessionStatusBar() {
  const { onlineSessionId, onlineRole, onlineSessionName, p1Likes, p2Likes, exitOnlineSession } = useMovieContext();
  const [copied, setCopied] = useState(false);

  if (!onlineSessionId) return null;

  const handleCopy = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${onlineSessionId}&mode=guest`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.2 } });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const myLikesCount = onlineRole === 'p1' ? p1Likes.length : p2Likes.length;
  const partnerLikesCount = onlineRole === 'p1' ? p2Likes.length : p1Likes.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto mb-4 px-4 py-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1C1A17] border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 flex-shrink-0">
          <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
              {onlineSessionName || `Session #${onlineSessionId}`}
            </span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-sans font-medium uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 flex-shrink-0">
              {onlineRole === 'p1' ? 'Host' : 'Partner'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-sans font-light text-stone-600 dark:text-stone-400 truncate">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Matching Mode Active</span>
            <span>•</span>
            <span>You: {myLikesCount} picks</span>
            <span>•</span>
            <span>Partner: {partnerLikesCount} picks</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-xl font-sans font-medium text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm ${
            copied
              ? 'bg-emerald-800 text-white'
              : 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95'
          }`}
          title="Copy live invite link for friend"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Invite</span>
            </>
          )}
        </button>

        <button
          onClick={exitOnlineSession}
          className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Exit Online Session"
        >
          <LogOut strokeWidth={1.25} className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
