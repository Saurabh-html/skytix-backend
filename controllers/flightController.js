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

    res.json({ success: true, message: `${count} flights created` });

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
    const selectedDay = date ? new Date(date).getDay() : null;

    const result = flights
      .filter(f => {
        if (date) {
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
        const seats =
          dateKey && f.seatsByDate.get(dateKey) !== undefined
            ? f.seatsByDate.get(dateKey)
            : f.seatsAvailable;

        return {
          ...f._doc,
          seatsAvailable: seats
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

module.exports = {
  createFlight,
  getFlights,
  cancelFlight,
  bulkCreateFlights,
  cancelFlightByDate,
  deleteFlight
};