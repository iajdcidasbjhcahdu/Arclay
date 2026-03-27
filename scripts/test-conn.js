import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    let MONGODB_URI = process.env.MONGODB_URI;
    const dbName = (process.env.NEXT_PUBLIC_SITE_NAME || 'arclay').toLowerCase();
    
    if (!MONGODB_URI.includes('.net/')) {
        MONGODB_URI = MONGODB_URI.replace('.net', `.net/${dbName}`);
    }
    if (!MONGODB_URI.includes('?')) {
        MONGODB_URI += '?retryWrites=true&w=majority';
    }

    console.log('Testing connection to:', MONGODB_URI);
    
    try {
        await mongoose.connect(MONGODB_URI, { 
            serverSelectionTimeoutMS: 5000 
        });
        console.log('✅ Connected successfully!');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Found collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

test();
