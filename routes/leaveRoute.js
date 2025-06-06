const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

router.get('/', leaveController.getAllLeaves);
router.post('/', leaveController.createLeave);
router.get('/:id', leaveController.getLeave);
router.put('/:id', leaveController.updateLeave);
router.delete('/:id', leaveController.deleteLeave);
router.get('/employee/:id', leaveController.getEmployeeLeaves);

module.exports = router;