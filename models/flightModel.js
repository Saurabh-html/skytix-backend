const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true
  },
  airline: {
    type: String,
    default: 'Skytix'
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },

  // ✅ IMPORTANT FIX
  seatsAvailable: {
    type: Number,
    required: true
  },

  seatsByDate: {
    type: Map,
    of: Number,
    default: {}
  },

  scheduleType: {
    type: String,
    enum: ['daily', 'weekly'],
    required: true
  },

  daysOfWeek: {
    type: [Number],
    default: []
  },

  cancelledDates: {
    type: [String],
    default: []
  },

  status: {
    type: String,
    enum: ['scheduled', 'cancelled'],
    default: 'scheduled'
  }

}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);