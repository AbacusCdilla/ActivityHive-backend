const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Fix: CORS Middleware
app.use(cors({
  origin: "https://abacuscdilla.github.io", // ✅ Your frontend URL
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));

app.use(express.json());

// ✅ MongoDB Connection
const uri = "mongodb+srv://msharjeelzahid:Abacus41.@cluster0.zvz6v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let lessonsCollection;
let ordersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("lessonsDB");
    lessonsCollection = db.collection("lessons");
    ordersCollection = db.collection("orders");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ActivityHive Backend!" });
});

// ✅ Get All Lessons API
app.get("/lessons", async (req, res) => {
  try {
    const lessons = await lessonsCollection.find().toArray();
    res.json(lessons);
  } catch (err) {
    console.error("❌ Error fetching lessons:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// ✅ Place Order API (Fixed)
app.post("/orders", async (req, res) => {
  try {
    const { firstName, lastName, address, city, state, zip, items } = req.body;

    // ✅ Validation
    if (!firstName || !lastName || !address || !city || !state || !zip || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: "⚠️ Missing required fields" });
    }

    // ✅ Check Lesson Availability
    let allAvailable = true;
    for (const item of items) {
      const lesson = await lessonsCollection.findOne({ _id: new ObjectId(item.lessonId) });
      if (!lesson || lesson.space < item.quantity) {
        allAvailable = false;
        break;
      }
    }

    if (!allAvailable) {
      return res.status(400).json({ success: false, error: "⚠️ Not enough space in one or more lessons." });
    }

    // ✅ Insert Order & Update Lesson Spaces
    const session = client.startSession();
    await session.withTransaction(async () => {
      const orderResult = await ordersCollection.insertOne({
        firstName,
        lastName,
        address,
        city,
        state,
        zip,
        items,
        createdAt: new Date()
      }, { session });

      // ✅ Reduce Lesson Spaces
      for (const item of items) {
        await lessonsCollection.updateOne(
          { _id: new ObjectId(item.lessonId) },
          { $inc: { space: -item.quantity } },
          { session }
        );
      }

      res.status(201).json({ success: true, message: "🎉 Order placed successfully!", orderId: orderResult.insertedId });
    });

    await session.endSession();
  } catch (err) {
    console.error("❌ Error processing order:", err);
    res.status(500).json({ success: false, error: "❌ Failed to place order" });
  }
});

// ✅ Start Server
connectDB().then(() => {
  app.listen(port, () => 
    console.log(`🚀 Server running on Render: https://activityhive-backend-1.onrender.com`)
  );
});
