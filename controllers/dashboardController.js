const Employee = require('../models/employee');
const Attendance = require('../models/attendance');
const Leave = require('../models/leave');
const { format } = require('date-fns');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Get all counts in parallel for better performance
        const [totalEmployees, presentToday, onLeaveEmployees] = await Promise.all([
            Employee.countDocuments(),
            Attendance.countDocuments({ date: today, status: 'Present' }),
            Employee.countDocuments({ status: 'On Leave' })
        ]);

        const absentToday = totalEmployees - presentToday - onLeaveEmployees;

        res.json({
            totalEmployees,
            presentToday,
            onLeave: onLeaveEmployees,
            absentToday: absentToday > 0 ? absentToday : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecentLeaves = async (req, res) => {
    try {
        const recentLeaves = await Leave.find()
            .sort({ submittedDate: -1 })
            .limit(5)
            .lean();

        res.json(recentLeaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getChartData = async (req, res) => {
    try {
        // Get dates for the past 7 days
        const dates = [];
        const dateStrings = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date);
            dateStrings.push(format(date, 'yyyy-MM-dd'));
        }

        // Get attendance data for these dates
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $in: dateStrings }
                }
            },
            {
                $group: {
                    _id: { date: "$date", status: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Process into chart format
        const presentData = [];
        const absentData = [];
        
        dateStrings.forEach(date => {
            const present = attendanceData.find(d => d._id.date === date && d._id.status === 'Present');
            const absent = attendanceData.find(d => d._id.date === date && d._id.status === 'Absent');
            
            presentData.push(present ? present.count : 0);
            absentData.push(absent ? absent.count : 0);
        });

        // Get leave type distribution
        const leaveDistribution = await Leave.aggregate([
            {
                $group: {
                    _id: "$leaveType",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            attendanceChart: {
                labels: dates.map(d => format(d, 'EEE')),
                presentData,
                absentData
            },
            leaveChart: leaveDistribution.map(item => ({
                leaveType: item._id,
                count: item.count
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};