const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight'
  },

  date: {
    type: Date,
    required: true
  },

  // 🔥 UPDATED PASSENGER STRUCTURE
  passengers: [
    {
      name: String,
      age: Number,
      gender: String,
      seat: String   // ✅ NEW
    }
  ],

  // 🔥 NEW
  seatClass: {
    type: String,
    enum: ['economy', 'business', 'first'],
    required: true
  },

  totalPrice: Number

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);