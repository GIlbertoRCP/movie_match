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
      <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <span className="text-xs font-medium">Fetching streaming options...</span>
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>Where to Watch</span>
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-slate-900 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 transition-all"
        >
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {!hasAny ? (
        <div className="text-center py-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">
            No digital streaming options found for region ({selectedRegion}).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stream / Subscription */}
          {hasFlatrate && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                <Tv className="w-3 h-3" />
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                <Film className="w-3 h-3" />
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                <ShoppingBag className="w-3 h-3" />
                <span>Buy</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {providers.buy.map(p => (
                  <ProviderBadge key={p.provider_id} provider={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {providers?.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors pt-1"
        >
          <span>View on TMDB JustWatch</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function ProviderBadge({ provider }) {
  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 pr-3 shadow-sm hover:border-slate-700 transition-all">
      {provider.logo_path ? (
        <img
          src={provider.logo_path}
          alt={provider.provider_name}
          className="w-6 h-6 rounded-md object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-6 h-6 rounded-md bg-purple-900/40 text-purple-300 flex items-center justify-center font-bold text-[10px]">
          {provider.provider_name.charAt(0)}
        </div>
      )}
      <span className="text-xs font-semibold text-slate-200">{provider.provider_name}</span>
    </div>
  );
}
