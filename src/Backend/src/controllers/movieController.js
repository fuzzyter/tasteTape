import * as movieApi from "../services/movieApiService.js";

export async function getTrending(req, res) {
  try {
    const data = await movieApi.fetchTrending();
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMovie(req, res) {
  try {
    const movieId = req.params.id;
    const movie = await movieApi.fetchMovie(movieId);
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function search(req, res) {
  try {
    const q = req.query.q;
    const results = await movieApi.searchMovies(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSimilar(req, res) {
  try {
    const movieId = req.params.id;
    const results = await movieApi.fetchSimilar(movieId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
