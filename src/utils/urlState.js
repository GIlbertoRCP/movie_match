/**
 * URL State Serialization and Deserialization Helper
 */

export function generateShareableURL(p1Likes = [], filters = {}, customMovieIds = [], packId = null) {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();

  if (p1Likes.length > 0) {
    params.set('p1', p1Likes.join(','));
  }

  if (customMovieIds.length > 0) {
    params.set('list', customMovieIds.join(','));
  }

  if (packId) {
    params.set('pack', packId);
  }

  if (filters.genreId && filters.genreId !== 'all') {
    params.set('genre', filters.genreId);
  }
  if (filters.minScore && filters.minScore > 0) {
    params.set('minScore', filters.minScore);
  }
  if (filters.region) {
    params.set('region', filters.region);
  }
  if (filters.startYear) {
    params.set('startYear', filters.startYear);
  }
  if (filters.endYear) {
    params.set('endYear', filters.endYear);
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function parseURLState() {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session');
  const sessionMode = searchParams.get('mode');
  const p1Raw = searchParams.get('p1');
  const listRaw = searchParams.get('list');
  const packId = searchParams.get('pack');

  const p1Likes = p1Raw
    ? p1Raw.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];

  const customMovieIds = listRaw
    ? listRaw.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [];

  const filters = {
    genreId: searchParams.get('genre') || 'all',
    minScore: parseFloat(searchParams.get('minScore')) || 6.5,
    region: searchParams.get('region') || 'US',
    startYear: searchParams.get('startYear') || '',
    endYear: searchParams.get('endYear') || ''
  };

  return {
    sessionId,
    sessionMode,
    p1Likes,
    customMovieIds,
    packId,
    filters,
    isAsyncLink: Boolean(p1Raw || listRaw || packId || sessionId)
  };
}

export async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
