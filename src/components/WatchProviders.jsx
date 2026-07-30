import React, { useState, useEffect } from 'react';
import { fetchWatchProviders, REGIONS } from '../services/tmdbApi';
import { useMovieContext } from '../context/MovieContext';
import { Tv, Film, ShoppingBag, Globe, ExternalLink, Loader2 } from 'lucide-react';

export default function WatchProviders({ movieId, initialRegion = 'US' }) {
  const { apiKey } = useMovieContext();
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProviders() {
      if (!movieId) return;
      setLoading(true);
      try {
        const data = await fetchWatchProviders(movieId, selectedRegion, apiKey);
        if (isMounted) {
          setProviders(data);
        }
      } catch (err) {
        console.error('Error fetching watch providers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProviders();
    return () => { isMounted = false; };
  }, [movieId, selectedRegion, apiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-stone-500 dark:text-stone-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-stone-600 dark:text-stone-400" />
        <span className="text-xs font-sans font-light">Fetching streaming availability...</span>
      </div>
    );
  }

  const hasFlatrate = providers?.flatrate && providers.flatrate.length > 0;
  const hasRent = providers?.rent && providers.rent.length > 0;
  const hasBuy = providers?.buy && providers.buy.length > 0;
  const hasAny = hasFlatrate || hasRent || hasBuy;

  return (
    <div className="w-full space-y-4">
      {/* Region Selector Header */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-sans font-medium uppercase tracking-wider text-stone-600 dark:text-stone-400">
          <Globe className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          <span>Where to Watch</span>
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-[#FFFDF9] dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-stone-500 transition-all font-sans font-medium"
        >
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {!hasAny ? (
        <div className="text-center py-4 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-600 dark:text-stone-400 font-sans font-light">
            No digital streaming options found for region ({selectedRegion}).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stream / Subscription */}
          {hasFlatrate && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                <Tv className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                <span>Stream Subscription</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {providers.flatrate.map(p => (
                  <ProviderBadge key={p.provider_id} provider={p} />
                ))}
              </div>
            </div>
          )}

          {/* Rent */}
          {hasRent && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                <Film className="w-3 h-3 text-stone-700 dark:text-stone-400" />
                <span>Rent</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {providers.rent.map(p => (
                  <ProviderBadge key={p.provider_id} provider={p} />
                ))}
              </div>
            </div>
          )}

          {/* Buy */}
          {hasBuy && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                <ShoppingBag className="w-3 h-3 text-stone-700 dark:text-stone-400" />
                <span>Buy</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {providers.buy.map(p => (
                  <ProviderBadge key={p.provider_id} provider={p} />
                ))}
              </div>
            </div>
          )}

          {/* JustWatch Credit */}
          {providers?.link && (
            <div className="pt-2 text-right">
              <a
                href={providers.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-sans font-light text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <span>Streaming data provided by JustWatch</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProviderBadge({ provider }) {
  return (
    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-[#FFFDF9] dark:bg-stone-800 border border-stone-300/70 dark:border-stone-700 shadow-sm">
      {provider.logo_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
          alt={provider.provider_name}
          className="w-6 h-6 rounded-md object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-300">
          {provider.provider_name.charAt(0)}
        </div>
      )}
      <span className="text-xs font-sans font-medium text-stone-800 dark:text-stone-200">{provider.provider_name}</span>
    </div>
  );
}
