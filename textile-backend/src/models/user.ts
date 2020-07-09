import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    pwHash: string;
    privKeyHash: string;
    pubKey: string;
}

const UserSchema = new Schema(
    {
        username: { type: String, unique: true, required: false },
        firstName: { type: String, unique: true, required: false },
        lastName: { type: String, unique: true, required: false },
        email: { type: String, unique: true, required: false },
        pwHash: { type: String, unique: true, required: false },
        privKeyHash: { type: String, unique: true, required: false },
        pubKey: { type: String, unique: true, required: false },
    },
    {
        collection: 'user',
        timestamps: true,
    },
);
export default mongoose.model<IUser>('user', UserSchema);
