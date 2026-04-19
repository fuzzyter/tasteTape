// TasteTape Backend - Express server with Clerk authentication & MongoDB
// Routes: /protected (auth), /api/movies, /api/reviews

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { clerkMiddleware, requireAuth } from '@clerk/express'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastetape')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB connection failed:', err))

// Review Schema
const reviewSchema = new mongoose.Schema({
  movieTitle: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
})

const Review = mongoose.model('Review', reviewSchema)

// Protected route - requires Clerk authentication
app.get('/protected', requireAuth({ signInUrl: '/sign-in' }), (req, res) => {
  res.send('This is a protected route.')
})

// GET endpoint to fetch movies from TMDB API
app.get('/api/movies', async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const page = req.query.page || 1

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    res.json({
      message: "Popular movies fetched successfully",
      total_pages: data.total_pages,
      total_results: data.total_results,
      movies: data.results
    })
  } catch (error) {
    console.error("Error fetching movies:", error.message)
    res.status(500).json({ error: 'Failed to fetch movies from TMDB' })
  }
})

// POST endpoint to submit a review
app.post('/api/reviews', async (req, res) => {
  try {
    const { movieTitle, userName, rating, reviewText } = req.body

    // Validate input
    if (!movieTitle || !userName || !rating || !reviewText) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const newReview = new Review({ movieTitle, userName, rating, reviewText })
    await newReview.save()

    res.status(201).json({
      message: "Review submitted successfully!",
      review: newReview
    })
  } catch (error) {
    console.error("Error saving review:", error.message)
    res.status(500).json({ error: 'Failed to save review' })
  }
})

// GET endpoint to fetch reviews for a specific movie
app.get('/api/reviews/:movieTitle', async (req, res) => {
  try {
    const { movieTitle } = req.params
    const movieReviews = await Review.find({
      movieTitle: { $regex: movieTitle, $options: 'i' }
    })

    // Calculate average rating
    const avgRating = movieReviews.length > 0
      ? (movieReviews.reduce((sum, r) => sum + r.rating, 0) / movieReviews.length).toFixed(1)
      : 0

    res.json({
      movieTitle,
      totalReviews: movieReviews.length,
      averageRating: parseFloat(avgRating),
      reviews: movieReviews
    })
  } catch (error) {
    console.error("Error fetching reviews:", error.message)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// GET endpoint to fetch all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
    const groupedByMovie = {}

    reviews.forEach(review => {
      if (!groupedByMovie[review.movieTitle]) {
        groupedByMovie[review.movieTitle] = []
      }
      groupedByMovie[review.movieTitle].push(review)
    })

    // Calculate stats for each movie
    const stats = Object.entries(groupedByMovie).map(([title, reviews]) => ({
      movieTitle: title,
      totalReviews: reviews.length,
      averageRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
      reviews
    }))

    res.json({
      message: "All reviews with analysis",
      totalMoviesReviewed: stats.length,
      data: stats
    })
  } catch (error) {
    console.error("Error fetching all reviews:", error.message)
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`TasteTape Backend is running on http://localhost:${PORT}`)
})