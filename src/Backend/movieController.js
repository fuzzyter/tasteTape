import * as movieApi from "../services/movieApiService.js";

export async function getMovie(req, res) {
    const movieId = req.params.id;
    const movie = await movieApi.fetchMovie(movieId);
    res.json(movie);
}

export async function search(req, res) {
    const q = req.query.q;
    const results = await movieApi.searchMovies(q);
    res.json(results);
}

export async function getSimilar(req, res) {
    const movieId = req.params.id;
    const results = await movieApi.fetchSimilar(movieId);
    res.json(results);
}
