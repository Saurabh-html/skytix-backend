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

  price: {
    type: Number,
    required: true,
    min: 0
  },

  seatsAvailable: {
    type: Number,
    required: true,
    min: 1
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
    validate: {
      validator: function (arr) {
        if (this.scheduleType === 'weekly') {
          return arr.length > 0;
        }
        return true;
      },
      message: 'daysOfWeek required for weekly flights'
    }
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