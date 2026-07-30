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

    async function checkServerHealth() {
      // Set 4 second threshold for cold start notification
      timeoutId = setTimeout(() => {
        if (isSubscribed && !dismissed) {
          setIsWaking(true);
          setIsReady(false);
        }
      }, 4000);

      try {
        const start = Date.now();
        const res = await fetch(`${BACKEND_API}/health`);
        const elapsed = Date.now() - start;

        clearTimeout(timeoutId);

        if (res.ok && isSubscribed) {
          setIsReady(true);
          if (elapsed > 4000) {
            setTimeout(() => {
              if (isSubscribed) setIsWaking(false);
            }, 2500);
          } else {
            setIsWaking(false);
          }
        } else if (isSubscribed) {
          setIsWaking(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (isSubscribed) {
          setIsWaking(false);
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
        id="server-cold-start-banner"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-stone-900/95 dark:bg-stone-100/95 text-stone-100 dark:text-stone-900 backdrop-blur-xl border border-stone-700/60 dark:border-stone-300/60 shadow-2xl flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-stone-800 dark:bg-stone-200 border border-stone-700 dark:border-stone-300 text-stone-300 dark:text-stone-700 flex-shrink-0">
            {!isReady ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-300 dark:text-stone-700" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-600" />
            )}
          </div>

          <div>
            <h4 className="text-xs font-serif font-normal text-stone-100 dark:text-stone-900 flex items-center gap-1.5">
              {!isReady ? 'Waking Up Movie Server...' : 'Server Connected!'}
            </h4>
            <p className="text-[11px] font-sans font-light text-stone-400 dark:text-stone-600">
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
          className="p-1.5 rounded-full bg-stone-800/80 dark:bg-stone-200/80 hover:bg-stone-700 dark:hover:bg-stone-300 text-stone-400 dark:text-stone-600 hover:text-stone-100 dark:hover:text-stone-900 border border-stone-700/60 dark:border-stone-300/60 transition-colors flex-shrink-0 cursor-pointer"
          title="Dismiss Banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
