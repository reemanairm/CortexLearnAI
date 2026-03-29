import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();

    console.log("Users in DB:");
    for (const u of users) {
        if (u.email.includes('reema') || u.role === 'admin') {
            console.log(`Email: ${u.email}, Role: ${u.role}, Password length: ${u.password ? u.password.length : 'none'}`);
            if (u.password && u.password.length > 0) {
                // try checking 'password123'
                const match = await bcrypt.compare('password123', u.password);
                console.log(`   Matches 'password123'? ${match}`);
            }
        }
    }
    process.exit(0);
}
check();
