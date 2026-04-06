import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: { type: String, select: false },
    role: String,
});

const User = mongoose.model('User', UserSchema);

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        let user = await User.findOne({ username: 'test' });
        if (user) {
            user.password = hashedPassword;
            user.role = 'admin';
            await user.save();
            console.log("Updated existing 'test' user to admin with password 'password123'");
        } else {
            user = await User.create({
                username: 'test',
                email: 'test@gmail.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log("Created new 'test' user as admin with password 'password123'");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
