const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/smartbooking')
    .then(async () => {
        const users = await User.find({}, 'email password_hash');
        console.log(users);
        process.exit(0);
    });
