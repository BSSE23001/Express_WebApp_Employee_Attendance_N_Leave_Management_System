const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/', attendanceController.getAttendanceRecords);
router.post('/', attendanceController.createAttendanceRecord);
router.get('/employees', attendanceController.getEmployeesForAttendance);
router.get('/date/:date', attendanceController.getAttendanceByDate);
router.delete('/:id', attendanceController.deleteAttendanceRecord);

module.exports = router;