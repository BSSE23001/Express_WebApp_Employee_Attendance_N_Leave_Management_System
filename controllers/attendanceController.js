const Attendance = require('../models/attendance');
const Employee = require('../models/employee');
const mongoose = require('mongoose');

// Get all attendance records
exports.getAttendanceRecords = async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate('employee', 'id name department position')
            .sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAttendanceRecord = async (req, res) => {
    try {
        const { employeeId, date, status, checkIn, checkOut } = req.body;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check for existing record
        const existingRecord = await Attendance.findOne({
            employee: employeeId,
            date: new Date(date)
        });

        if (existingRecord) {
            return res.status(400).json({ 
                message: 'Attendance already recorded for this employee on the selected date' 
            });
        }

        const attendance = new Attendance({
            employee: employeeId,
            date: new Date(date),
            status,
            checkIn: status === 'Present' ? checkIn : null,
            checkOut: status === 'Present' ? checkOut : null
        });

        await attendance.save();
        
        // Populate employee details in the response
        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('employee', 'id name department position');

        res.status(201).json(populatedAttendance);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get employees available for attendance marking
exports.getEmployeesForAttendance = async (req, res) => {
    try {
        const employees = await Employee.find({ status: 'Active' })
            .select('id name department position');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance by date
exports.getAttendanceByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const attendance = await Attendance.find({ date })
            .populate('employee', 'id name department position')
            .sort({ 'employee.name': 1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete attendance record
exports.deleteAttendanceRecord = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid attendance ID' });
        }

        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};