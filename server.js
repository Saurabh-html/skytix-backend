const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');


// Connect Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.use('/api/users', userRoutes);

app.use('/api/flights', flightRoutes);

app.use('/api/bookings', bookingRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});