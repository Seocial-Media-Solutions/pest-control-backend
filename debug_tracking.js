
import mongoose from 'mongoose';
import Tracking from './src/models/tracking.model.js';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pest_control';

async function checkTracking() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        console.log('--- Checking All Tracking Records ---');
        const count = await Tracking.countDocuments();
        console.log(`Total Tracking Docs: ${count}`);

        const all = await Tracking.find().limit(2);
        console.log('Sample Docs:', JSON.stringify(all, null, 2));

        console.log('--- Checking Aggregation ---');
        const aggregateResult = await Tracking.aggregate([
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: '$technicianId',
                    latestTracking: { $last: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$latestTracking' }
            }
        ]);
        console.log(`Aggregation Count: ${aggregateResult.length}`);
        console.log('Aggregation Sample:', JSON.stringify(aggregateResult[0], null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTracking();
