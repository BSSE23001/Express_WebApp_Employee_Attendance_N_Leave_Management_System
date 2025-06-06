const Leave = require('../models/leave');
const Employee = require('../models/employee');
const mongoose = require('mongoose');

exports.getAllLeaves = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { leaveType: { $regex: search, $options: 'i' } },
                { reason: { $regex: search, $options: 'i' } }
            ];
        }
        
        const leaves = await Leave.find(query)
            .sort({ submittedDate: -1 });
            
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createLeave = async (req, res) => {
    try {
        const { employeeId, leaveType, startDate, endDate, reason } = req.body;
        
        // Get employee details
        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        // Calculate days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        // Generate simple incremental ID
        const lastLeave = await Leave.findOne().sort({ id: -1 });
        const nextId = lastLeave ? parseInt(lastLeave.id.split('-')[1]) + 1 : 1;
        const leaveId = `LV-${nextId.toString().padStart(3, '0')}`;
        
        const leave = new Leave({
            id: leaveId,
            employeeId: employee.id,
            employeeName: `${employee.name} (${employee.id})`,
            leaveType,
            startDate: start,
            endDate: end,
            reason,
            days,
            status: 'Pending'
        });
        
        await leave.save();
        res.status(201).json(leave);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.updateLeave = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid leave ID' });
        }
        
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        
        // Update employee status if approved
        if (status === 'Approved') {
            await Employee.findOneAndUpdate(
                { id: leave.employeeId },
                { status: 'On Leave' }
            );
        }
        
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteLeave = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid leave ID' });
        }
        
        const leave = await Leave.findByIdAndDelete(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        
        res.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLeave = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid leave ID' });
        }
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employeeId: req.params.id })
            .sort({ submittedDate: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};