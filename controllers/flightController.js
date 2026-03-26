const Flight = require('../models/flightModel');

//  Utility (NO timezone bug)
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
    const { from, to } = req.query;

    let query = {};

    if (from) query.from = from;
    if (to) query.to = to;

    const flights = await Flight.find(query);

    res.json({
      success: true,
      flights
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching flights'
    });
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
    const { id } = req.params;

    const updatedFlight = await Flight.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedFlight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.status(200).json({
      message: 'Flight updated successfully',
      flight: updatedFlight
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating flight'
    });
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