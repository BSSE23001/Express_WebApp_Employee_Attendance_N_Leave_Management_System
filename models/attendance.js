const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee reference is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    status: {
        type: String,
        enum: {
            values: ['Present', 'Absent', 'Late', 'On Leave'],
            message: 'Status must be Present, Absent, Late, or On Leave'
        },
        required: [true, 'Status is required']
    },
    checkIn: {
        type: String,
        validate: {
            validator: function(v) {
                return this.status !== 'Present' || v;
            },
            message: 'Check-in time is required for Present status'
        }
    },
    checkOut: {
        type: String,
        validate: {
            validator: function(v) {
                return this.status !== 'Present' || v;
            },
            message: 'Check-out time is required for Present status'
        }
    }
}, { timestamps: true });

// Prevent duplicate attendance records for same employee on same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;