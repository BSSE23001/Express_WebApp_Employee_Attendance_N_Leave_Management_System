const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    employeeId: {
        type: String,
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    leaveType: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    submittedDate: {
        type: Date,
        default: Date.now
    },
    days: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
module.exports = Leave;