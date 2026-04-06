import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const UserTest = mongoose.model('UserTest', userSchema);

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/testdb_local');
    console.log("Connected");

    try {
        const u = await UserTest.create({
            email: 'original@example.com',
            password: 'password123'
        });
        console.log("Created successfully!");
    } catch (e) {
        console.error("Error creating user", e);
    }

    process.exit(0);
}
check();
