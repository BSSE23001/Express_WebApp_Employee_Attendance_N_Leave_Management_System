const Employee = require('../models/employee');
const Joi = require('joi');

exports.getAllEmployees = async (req, res) => {
    try {
        const { sortBy, sortOrder } = req.query;
        let sortOptions = {};
        
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const employees = await Employee.find().sort(sortOptions);
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOne({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const { error } = validateEmployeeData(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Check if employee exists
        let employee = await Employee.findOne({ id: req.body.id });
        if (employee) return res.status(400).json({ message: 'Employee already exists' });

        employee = new Employee(req.body);
        await employee.save();
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.updateEmployee = async (req, res) => {
    try {
        // Validate employee data
        const { error } = validateEmployeeData(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const employee = await Employee.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.searchEmployees = async (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const employees = await Employee.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } },
                { position: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function validateEmployeeData(data) {
    const schema = Joi.object({
        id: Joi.string().required().label('Employee ID'),
        name: Joi.string().required().label('Name'),
        email: Joi.string().email().required().label('Email'),
        phone: Joi.string().pattern(/^[\d\s\-()+]{10,}$/).required().label('Phone'),
        department: Joi.string().required().label('Department'),
        position: Joi.string().required().label('Position'),
        joinDate: Joi.date().required().label('Join Date'),
        status: Joi.string().valid('Active', 'Inactive').required().label('Status')
    });

    return schema.validate(data);
}




exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findOne({ id: req.params.id });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};