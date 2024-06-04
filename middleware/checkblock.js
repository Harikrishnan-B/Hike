const collection = require('../models/user');

const checkblock = async (req, res, next) => {
    try {
        let user_email = req.session.user;

        const user = await collection.findOne({ email: user_email }); // Use findOne instead of find

        if (!user) {
            return res.redirect('/login'); // User not found, redirect to login
        }

        if (user.isBlocked) {
            req.session.user = false;
            return res.redirect('/login'); // User is blocked, redirect to login
        } else {
            // User is not blocked, proceed with the next middleware
            next();
        }
    } catch (error) {
        console.error('Error in checkblock middleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = { checkblock };
