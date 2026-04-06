import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

import User from './models/User.js';

async function check() {
    await mongoose.connect(uri);
    console.log("Connected");

    try {
        const u = await User.create({
            username: 'testuser123',
            email: 'testuser123@example.com',
            password: 'password123'
        });
        console.log("Created successfully", u);
    } catch (e) {
        console.error("Error creating user", e);
    }

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log("Users in DB:");
    users.forEach(u => console.log(u.email));
    process.exit(0);
}
check();
