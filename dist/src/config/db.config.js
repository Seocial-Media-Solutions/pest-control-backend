import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.error('💡 Make sure MongoDB is running on your system');
        console.warn('⚠️  Server will continue without database connection');
    }
};
export default connectDB;
