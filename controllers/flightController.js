const Flight = require('../models/flightModel');

// 🔧 Utility (NO timezone bug)
const getDateKey = (date) => {
  return new Date(date).toLocaleDateString('en-CA'); // YYYY-MM-DD
};

// CREATE FLIGHT
const createFlight = async (req, res) => {
  try {
    const flight = await Flight.create({
      ...req.body,
      seatsByDate: {},
      cancelledDates: []
    });

    res.status(201).json({ success: true, data: flight });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// BULK CREATE
const bulkCreateFlights = async (req, res) => {
  try {
    const { baseFlightNumber, count, ...rest } = req.body;

    if (!baseFlightNumber || !count) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const flights = [];

    for (let i = 0; i < count; i++) {
      flights.push({
        ...rest,
        flightNumber: `${baseFlightNumber}-${i + 1}`,
        seatsByDate: {},
        cancelledDates: []
      });
    }

    await Flight.insertMany(flights);

    res.json({
      success: true,
      message: `${count} flights created (use wisely to avoid duplicates)`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET FLIGHTS
const getFlights = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    let query = {};

    if (from) query.from = { $regex: from, $options: 'i' };
    if (to) query.to = { $regex: to, $options: 'i' };

    const flights = await Flight.find(query);

    const dateKey = date ? getDateKey(date) : null;
    const selectedDate = date ? new Date(date) : null;
    const selectedDay = selectedDate ? selectedDate.getDay() : null;

    // ✅ NEW: 2 MONTH WINDOW
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);

    const result = flights
      .filter(f => {
        if (date) {

          // ❌ block past
          if (selectedDate < today) return false;

          // ❌ block beyond 2 months
          if (selectedDate > maxDate) return false;

          // schedule check
          if (f.scheduleType === 'weekly' && !f.daysOfWeek.includes(selectedDay)) {
            return false;
          }

          // cancelled date
          if (f.cancelledDates.includes(dateKey)) {
            return false;
          }
        }
        return true;
      })
      .map(f => {

        let seats = {};
        let prices = {};

        if (dateKey && f.seatsByDate.get(dateKey)) {
          seats = f.seatsByDate.get(dateKey);
        } else {
          seats = f.seatConfig || {};
        }

        prices = f.priceConfig || {};

        return {
          ...f._doc,
          seatsAvailable: seats,
          prices
        };
      });

    res.json({ success: true, flights: result });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
const deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    await flight.deleteOne();

    res.json({ success: true, message: 'Flight deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL FULL
const cancelFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    flight.status = 'cancelled';
    await flight.save();

    res.json({ success: true, message: 'Flight cancelled' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL DATE
const cancelFlightByDate = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date required' });
    }

    const flight = await Flight.findById(req.params.id);

    const dateKey = getDateKey(date);

    if (!flight.cancelledDates.includes(dateKey)) {
      flight.cancelledDates.push(dateKey);
    }

    await flight.save();

    res.json({ success: true, message: 'Cancelled for date' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    //  Update basic fields
    flight.flightNumber = req.body.flightNumber || flight.flightNumber;
    flight.from = req.body.from || flight.from;
    flight.to = req.body.to || flight.to;
    flight.departureTime = req.body.departureTime || flight.departureTime;
    flight.arrivalTime = req.body.arrivalTime || flight.arrivalTime;

    //  Seat config
    if (req.body.seatConfig) {
      flight.seatConfig = req.body.seatConfig;
    }

    //  Price config
    if (req.body.priceConfig) {
      flight.priceConfig = req.body.priceConfig;
    }

    await flight.save();

    res.json({ success: true, message: 'Flight updated' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFlight,
  getFlights,
  cancelFlight,
  bulkCreateFlights,
  cancelFlightByDate,
  deleteFlight,
  updateFlight
};