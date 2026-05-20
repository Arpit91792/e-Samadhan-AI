/**
 * Must run before any Mongoose model is imported.
 * Prevents 10s "buffering timed out" when DB is disconnected.
 */
import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

export default mongoose;
