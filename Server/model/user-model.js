const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        tirm: true,
    },
    password: {
        type: String,
        // required: true,
    },
    googleId: {
        type:String
    },
    profile: {
        type: Boolean,
        default:false,
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = {
    User
}