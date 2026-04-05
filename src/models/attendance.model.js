const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Employee is required'],
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
        },
        checkIn: {
            type: Date,
            default: null,
        },
        checkOut: {
            type: Date,
            default: null,
        },
        totalWorkedMinutes: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            maxlength: [300, 'Notes cannot exceed 300 characters'],
            default: '',
        },
    },
    { timestamps: true }
);

// One attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
