import { User } from '../models/User.js';
import * as activityService from '../services/activityService.js';

// Add a movie to the user's watch history
export const updateHistory = async (req, res) => {
    if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { movieId } = req.body;
        await User.findOneAndUpdate(
            { clerkId: req.auth.userId },
            { $addToSet: { watchedMovies: movieId } },
            { upsert: true }
        );

        // Log the activity
        await activityService.logActivity(req.auth.userId, 'WATCHED', { movieId });

        res.json({ message: "History updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update the user's "vibes" or favorite genres
export const updatePreferences = async (req, res) => {
    if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { preferences } = req.body;
        await User.findOneAndUpdate(
            { clerkId: req.auth.userId },
            { $set: { preferences: preferences } },
            { upsert: true }
        );

        // Log the activity
        await activityService.logActivity(req.auth.userId, 'VIBE_CHANGED', { vibe: preferences[0] });

        res.json({ message: "Preferences updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
