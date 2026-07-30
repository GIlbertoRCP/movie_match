import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_API } from '../config';
import { Server, Loader2, CheckCircle2, X } from 'lucide-react';

export default function ServerColdStartBanner() {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timeoutId;
    let isSubscribed = true;
    let retries = 0;

    async function checkServerHealth() {
      // Set 3 second threshold for cold start notification
      timeoutId = setTimeout(() => {
        if (isSubscribed && !dismissed) {
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
            setTimeout(() => {
              if (isSubscribed) setIsWaking(false);
            }, 2000);
          } else {
            setIsWaking(false);
          }
        } else if (isSubscribed) {
          retries += 1;
          if (retries < 3) {
            setTimeout(checkServerHealth, 5000);
          } else {
            // Auto-hide after 3 retries so user is not stuck
            setIsWaking(false);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          retries += 1;
          if (retries < 3) {
            setTimeout(checkServerHealth, 5000);
          } else {
            // Auto-hide after 3 retries to prevent blocking UI
            setIsWaking(false);
          }
        }
      }
    }

    checkServerHealth();

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isWaking || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 text-slate-100 shadow-2xl shadow-cyan-950/30 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
            {!isReady ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
              {!isReady ? 'Waking Up Movie Server...' : 'Server Connected!'}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {!isReady
                ? 'Server is spinning up from sleep mode (~30s on free hosting)'
                : 'Backend active & ready'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDismissed(true);
            setIsWaking(false);
          }}
          className="p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          title="Dismiss Banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
