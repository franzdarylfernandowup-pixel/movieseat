/**
 * TMDB (The Movie Database) API Integration Layer
 * 
 * Provides live metadata, posters, runtimes, and synopses.
 * Uses VITE_TMDB_API_KEY if present in .env.
 * If no key is configured or TMDB is down (Scenario S4), gracefully falls back
 * to curated TMDB image CDN assets and metadata without breaking the app.
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

export function getTmdbPosterUrl(posterPath) {
  if (!posterPath) return null
  if (posterPath.startsWith('http')) return posterPath
  return `${TMDB_IMAGE_BASE}${posterPath.startsWith('/') ? '' : '/'}${posterPath}`
}

export function getTmdbBackdropUrl(backdropPath) {
  if (!backdropPath) return null
  if (backdropPath.startsWith('http')) return backdropPath
  return `${TMDB_BACKDROP_BASE}${backdropPath.startsWith('/') ? '' : '/'}${backdropPath}`
}

/**
 * Fetch detailed movie data from TMDB API
 * @param {number|string} tmdbId
 * @returns {Promise<Object|null>}
 */
export async function fetchTmdbMovie(tmdbId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY

  if (!apiKey || apiKey === 'your-tmdb-v3-api-key') {
    return null
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`,
      { headers: { Accept: 'application/json' } }
    )

    if (!res.ok) {
      console.warn(`TMDB API returned ${res.status} for ID ${tmdbId}`)
      return null
    }

    const data = await res.json()
    return {
      title: data.title,
      synopsis: data.overview,
      runtime: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : null,
      poster: data.poster_path ? getTmdbPosterUrl(data.poster_path) : null,
      backdrop: data.backdrop_path ? getTmdbBackdropUrl(data.backdrop_path) : null,
      ratingVote: data.vote_average ? data.vote_average.toFixed(1) : null,
      genres: data.genres ? data.genres.map(g => g.name).join(' / ') : null,
    }
  } catch (err) {
    console.error('Failed to fetch from TMDB API (network error or service down):', err)
    return null
  }
}

/**
 * Enrich list of cinema movies with TMDB API data (or cached/fallback TMDB attributes)
 * @param {Array} movies
 * @returns {Promise<Array>}
 */
export async function enrichMoviesWithTmdb(movies) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey || apiKey === 'your-tmdb-v3-api-key') {
    return movies
  }

  const enriched = await Promise.all(
    movies.map(async (movie) => {
      if (!movie.tmdbId) return movie
      const liveData = await fetchTmdbMovie(movie.tmdbId)
      if (!liveData) return movie

      return {
        ...movie,
        title: liveData.title || movie.title,
        synopsis: liveData.synopsis || movie.synopsis,
        runtime: liveData.runtime || movie.runtime,
        poster: liveData.poster || movie.poster,
        genre: liveData.genres || movie.genre,
        tmdbVote: liveData.ratingVote,
      }
    })
  )

  return enriched
}
