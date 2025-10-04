import fetch from "node-fetch";

export const getMoviesFromTmdb = async (TMDB_KEY, minimumRating, genreId) => {
  minimumRating = minimumRating - 0.5;
  const fetchUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&vote_count.gte=500&sort_by=popularity.desc&vote_average.gte=${minimumRating}`;
  const firstPageResp = await fetch(`${fetchUrl}&page=1`);
  const firstPageData = await firstPageResp.json();
  const totalPages = firstPageData.total_pages;
  
  const randomPages = Array.from({length: 5}, () => Math.floor(Math.random() * totalPages) + 1);
  
  const pagePromises = randomPages.map(page => 
    fetch(`${fetchUrl}&page=${page}`)
      .then(resp => resp.json())
  );
  
  const pageResults = await Promise.all(pagePromises);
  const allResults = pageResults.flatMap(data => data.results);
  
  return { results: allResults };
}

export const getImdbId = async (TMDB_KEY, randomMovie) => {
  const extUrl = `https://api.themoviedb.org/3/movie/${randomMovie.id}/external_ids?api_key=${TMDB_KEY}`;
  const extResp = await fetch(extUrl);
  const extData = await extResp.json();
  const imdbId = extData.imdb_id;
  return imdbId;
}

export const fetchMovieDetails = async (OMDB_KEY, imdbId) => {
  console.log('entrou no fetchMovieDetails', imdbId);
  const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbId}`;
  const omdbResp = await fetch(omdbUrl);
  const omdbData = await omdbResp.json();
  return omdbData;
}

export const includesGenre = (genres, search) => {
  return genres
    .split(",")                        // split by commas
    .map(g => g.trim().toLowerCase())  // clean and lowercase
    .includes(search.toLowerCase());   // exact match
}