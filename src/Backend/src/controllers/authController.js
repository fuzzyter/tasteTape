import { User } from '../models/User.js';

// This function ensures the user exists in our MongoDB
export const syncUser = async (req, res) => {
    if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        let user = await User.findOne({ clerkId: req.auth.userId });

        // If they don't exist yet, create their profile
        if (!user) {
            user = await User.create({
                clerkId: req.auth.userId,
                watchedMovies: [],
                preferences: []
            });
            console.log(`🆕 New user synced: ${req.auth.userId}`);
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get the current user's full profile (history, vibes, etc.)
export const getProfile = async (req, res) => {
    if (!req.auth.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const user = await User.findOne({ clerkId: req.auth.userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
