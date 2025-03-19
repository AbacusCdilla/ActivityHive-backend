const { MongoClient, ObjectId } = require('mongodb');

// MongoDB URI
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createOrder(req, res) {
    try {
        await client.connect();
        const db = client.db('lessonsDB');
        const ordersCollection = db.collection('orders');
        const lessonsCollection = db.collection('lessons');

        const { firstName, lastName, address, city, state, zip, method, items } = req.body;

        /
        // ✅ Update lesson spaces
        for (const item of items) {
            const lessonId = new ObjectId(item.lessonId);
            const quantity = item.quantity;
            await lessonsCollection.updateOne(
                { _id: lessonId },
                { $inc: { space: -quantity } }
            );
        }

        // ✅ Fetch updated lessons
        const updatedLessons = await lessonsCollection.find().toArray();

        res.json({ success: true, lessons: updatedLessons });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Order creation failed' });
    } finally {
        await client.close();
    }
}

module.exports = { createOrder };
