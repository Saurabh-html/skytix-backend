const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({

  flightNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  airline: {
    type: String,
    default: 'Skytix'
  },

  from: {
    type: String,
    required: true,
    trim: true
  },

  to: {
    type: String,
    required: true,
    trim: true
  },

  departureTime: {
    type: String,
    required: true
  },

  arrivalTime: {
    type: String,
    required: true
  },

  // 🔥 NEW PRICE CONFIG
  priceConfig: {
    economy: { type: Number, required: true },
    business: { type: Number, required: true },
    first: { type: Number, required: true }
  },

  // 🔥 NEW SEAT CONFIG
  seatConfig: {
    economy: { type: Number, required: true },
    business: { type: Number, required: true },
    first: { type: Number, required: true }
  },

  // BACKWARD SAFE (KEEP)
  price: Number,
  seatsAvailable: Number,

  // 🔥 DATE-WISE CLASS SEATS
  seatsByDate: {
    type: Map,
    of: Object,
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