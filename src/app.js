// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fetchMovieDetails, getImdbId, getMoviesFromTmdb, includesGenre } from "./utils/utils.js";
import genresData from "./utils/genres.json" assert { type: "json" };

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const TMDB_KEY = process.env.TMDB_KEY;
const OMDB_KEY = process.env.OMDB_KEY;

// Example endpoint: Get random horror movie with IMDb filters
app.get("/random", async (req, res) => {
  try {
    const minimumRating = req.query.minimumRating ? parseFloat(req.query.minimumRating) : 0;
    const genre = req.query.genre ? req.query.genre.toLowerCase() : '';
    console.log('genreeeeeee', genre);
    const genreId = genresData.genres.find(g => g.name.toLowerCase() === genre)?.id || '';
    console.log('genreId', genreId);
    
    // 1. Discover horror movies from TMDb
    const tmdbData = await getMoviesFromTmdb(TMDB_KEY, minimumRating, genreId);

    // return res.json(tmdbData);

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Pick random movie from TMDb results
      const randomMovie = tmdbData.results[Math.floor(Math.random() * tmdbData.results.length)];
      console.log('randomMovie', randomMovie);

      // 2. Get IMDb ID from TMDb external_ids endpoint
      const imdbId = await getImdbId(TMDB_KEY, randomMovie);
      console.log('imdbId', imdbId);

      // 3. Fetch IMDb rating/votes from OMDb
      const omdbData = await fetchMovieDetails(OMDB_KEY, imdbId);
      const validGenre = includesGenre(omdbData.Genre, genre);
      console.log('validGenre', validGenre);

      // 4. Check filters: IMDb rating >= minimumRating, votes >= 5000
      const rating = parseFloat(omdbData.imdbRating);
      const votes = parseInt(omdbData.imdbVotes.replace(/,/g, ""), 10);

      if (rating >= minimumRating && votes >= 5000 && validGenre) {
        return res.json({
          title: omdbData.Title,
          year: omdbData.Year,
          imdbRating: rating,
          imdbVotes: votes,
          genre: omdbData.Genre,
          poster: omdbData.Poster
        });
      }

      console.log('############ omdbData ############', omdbData);

      console.log('############ attempts ############', attempts);

      attempts++;
    }

    res.json({ message: "No suitable movie found after multiple attempts" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
