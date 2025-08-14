
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); 

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error(' An error occured:', error.message);
  }
};

export default connectDB;
