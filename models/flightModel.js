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

  scheduleType: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily'
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