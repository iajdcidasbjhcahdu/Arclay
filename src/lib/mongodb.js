import mongoose from 'mongoose';

const rawURI = process.env.MONGODB_URI || "";
const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "arclay").toLowerCase();

let MONGODB_URI = rawURI;
if (rawURI && !rawURI.includes('.net/')) {
    MONGODB_URI = rawURI.replace('.net', `.net/${siteName}`);
}

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;