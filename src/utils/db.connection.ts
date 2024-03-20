import mongoose from 'mongoose';

export const dbConnection = async () => {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);

    let db = mongoose.connection.db;
    let collections = await db.listCollections({}, { nameOnly: true }).toArray();
    // mongoose.connection.close();
    return collections;
}