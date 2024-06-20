import mongoose from 'mongoose';

export const dbConnection = async () => {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    // mongoose.connection.close();
    return collections;
}