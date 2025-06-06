require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(express.json());

// Serve static HTML files from 'public' folder
app.use(express.static('public'));

// Routes
const dashboardRoute = require('./routes/dashboardRoute');
app.use('/dashboard', dashboardRoute);

const employeeRoute = require('./routes/employeeRoute');
app.use('/api/employees', employeeRoute);

const attendanceRoute = require('./routes/attendanceRoute');
app.use('/api/attendance', attendanceRoute);

const leaveRoute = require('./routes/leaveRoute');
app.use('/api/leaves', leaveRoute);

module.exports = app;