import mongoose from 'mongoose';

const MONGO_URI = '0.0.0.0:27017';
const db = mongoose.connection;

mongoose.connect(MONGO_URI);
db.on('error', console.error);
db.on('connected', () => console.log('connected to mongo'));
db.on('diconnected', () => console.log('Mongo is disconnected'));
db.on('open', () => console.log('Connection Made!'));
