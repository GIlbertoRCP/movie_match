import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_API } from '../config';
import { Server, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ServerColdStartBanner() {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    let timeoutId;
    let isSubscribed = true;

    async function checkServerHealth() {
      // Set 3 second threshold for cold start notification
      timeoutId = setTimeout(() => {
        if (isSubscribed) {
          setIsWaking(true);
          setIsReady(false);
        }
      }, 3000);

      try {
        const start = Date.now();
        const res = await fetch(`${BACKEND_API}/health`);
        const elapsed = Date.now() - start;

        clearTimeout(timeoutId);

        if (res.ok && isSubscribed) {
          setIsReady(true);
          if (elapsed > 3000) {
            // Show brief success toast before dismissing
            setTimeout(() => {
              if (isSubscribed) setIsWaking(false);
            }, 2500);
          } else {
            setIsWaking(false);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setIsWaking(true);
          setIsReady(false);
          // Retry health check in 5 seconds
          setTimeout(checkServerHealth, 5000);
        }
      }
    }

    checkServerHealth();

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isWaking) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 text-slate-100 shadow-2xl shadow-amber-950/20 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            {!isReady ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              {!isReady ? 'Waking Up Movie Server...' : 'Server Ready!'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {!isReady
                ? 'Server is spinning up from sleep mode (~30s on free hosting)'
                : 'Backend connected and active'}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
