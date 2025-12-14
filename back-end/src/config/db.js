import mongoose from "mongoose";

const MONGO_URI = "mongodb://localhost:27017/mydatabase";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection error ❌", err);
  }
};

export default connectDB;
