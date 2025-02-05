const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        trim: true, // Keep trim, but no uniqueness
    },
    email: {
        type: String,
        unique: true, // Email should be unique
        trim: true,
    },
    password: {
        type: String,
    },
    googleId: {
        type: String
    },
    profile: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });


const User = mongoose.model("User", userSchema);

module.exports = {
    User
}