document.addEventListener('DOMContentLoaded', function() {
    // Start the Complete Dynamicism of the webpage
    initApp();
});

async function initApp() {
    // Initialize Current State
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000);
    
    // Setup event listeners
    setupEventListeners();

    await loadEmployees();
}

// Setting up the Current Date
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Setting up Event Listeners for all the elements
function setupEventListeners() {    
    // Sidebar navigation Click Listener
    document.querySelectorAll('.app-sidebar nav li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showPage(section);
        });
    });
    
    // Employee management buttons listeners
    document.getElementById('add-employee-btn').addEventListener('click', showEmployeeForm);
    document.getElementById('cancel-employee-btn').addEventListener('click', hideEmployeeForm);
    document.getElementById('employee-form').addEventListener('submit', saveEmployee);
    document.getElementById('employee-search').addEventListener('input', filterEmployees);
    document.querySelectorAll('#employees-table th i.fa-sort').forEach(icon => {
        icon.addEventListener('click', function() {
            const sortBy = this.parentElement.getAttribute('data-sort');
            sortEmployees(sortBy);
        });
    });
    
    // Modal listeners
    document.querySelector('.close-modal').addEventListener('click', hideModal);
    document.getElementById('modal-cancel').addEventListener('click', hideModal);
}

// Function to show a hidden section when required
function showPage(sectionId) {
    
    // Load section data if based on requirement
    switch(sectionId) {
        case 'dashboard':
            window.location.href = "index.html";
            break;
        case 'employees':
            window.location.href = "employees.html";
            break;
        case 'attendance':
            window.location.href = "attendance.html";
            break;
        case 'leave':
            window.location.href = "leaves.html";
            break;
    }
}


// Employee Management Functions
function showEmployeeForm() {
    document.getElementById('employee-form-container').classList.remove('hidden');
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.getElementById('add-employee-btn').classList.add('hidden');
}

function hideEmployeeForm() {
    document.getElementById('employee-form').reset();
    document.getElementById('emp-id').removeAttribute('data-edit');
    document.getElementById('employee-form-container').classList.add('hidden');
    document.getElementById('add-employee-btn').classList.remove('hidden');
}

function validateEmployeeForm() {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-()+]{10,}$/;
    
    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Validate ID
    const id = document.getElementById('emp-id').value;
    if (!id) {
        document.getElementById('emp-id-error').textContent = 'Employee ID is required';
        isValid = false;
    }
    
    // Validate Name
    const name = document.getElementById('emp-name').value;
    if (!name) {
        document.getElementById('emp-name-error').textContent = 'Name is required';
        isValid = false;
    }
    
    // Validate Email
    const email = document.getElementById('emp-email').value;
    if (!email) {
        document.getElementById('emp-email-error').textContent = 'Email is required';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('emp-email-error').textContent = 'Invalid email format';
        isValid = false;
    }
    
    // Validate Phone
    const phone = document.getElementById('emp-phone').value;
    if (!phone) {
        document.getElementById('emp-phone-error').textContent = 'Phone is required';
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        document.getElementById('emp-phone-error').textContent = 'Invalid phone number';
        isValid = false;
    }
    
    // Validate Department
    const dept = document.getElementById('emp-dept').value;
    if (!dept) {
        document.getElementById('emp-dept-error').textContent = 'Department is required';
        isValid = false;
    }
    
    // Validate Position
    const position = document.getElementById('emp-position').value;
    if (!position) {
        document.getElementById('emp-position-error').textContent = 'Position is required';
        isValid = false;
    }
    
    // Validate Join Date
    const joinDate = document.getElementById('emp-join-date').value;
    if (!joinDate) {
        document.getElementById('emp-join-date-error').textContent = 'Join date is required';
        isValid = false;
    }
    
    return isValid;
}



async function loadEmployees(sortBy = null, sortOrder = 'asc') {
    showLoading();
    
    try {
        let url = '/api/employees';
        if (sortBy) {
            url += `?sortBy=${sortBy}&sortOrder=${sortOrder}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load employees');
        
        const employees = await response.json();
        renderEmployees(employees);
    } catch (error) {
        showNotification('Error', error.message, 'error');
        renderEmployees([]);
    } finally {
        hideLoading();
    }
}

function renderEmployees(employees) {
    const tableBody = document.getElementById('employees-table-body');
    tableBody.innerHTML = '';
    
    if (employees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No employees found</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${employee.position}</td>
            <td><span class="status-badge status-${employee.status.toLowerCase().replace(' ', '-')}">${employee.status}</span></td>
            <td class="table-actions">
                <button class="action-btn edit-btn" data-id="${employee.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${employee.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editEmployee(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            confirmDelete('employee', this.getAttribute('data-id'));
        });
    });
}



async function editEmployee(id) {
    showLoading();
    try {
        const response = await fetch(`/api/employees/${id}`);
        if (!response.ok) throw new Error('Failed to load employee');
        
        const employee = await response.json();
        
        document.getElementById('emp-id').value = employee.id;
        document.getElementById('emp-id').setAttribute('data-edit', 'true');
        document.getElementById('emp-name').value = employee.name;
        document.getElementById('emp-email').value = employee.email;
        document.getElementById('emp-phone').value = employee.phone;
        document.getElementById('emp-dept').value = employee.department;
        document.getElementById('emp-position').value = employee.position;
        document.getElementById('emp-join-date').value = employee.joinDate.split('T')[0];
        document.getElementById('emp-status').value = employee.status;
        
        showEmployeeForm();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}



async function saveEmployee(e) {
    e.preventDefault();
    
    if (!validateEmployeeForm()) return;
    
    showLoading();
    
    try {
        const employee = {
            id: document.getElementById('emp-id').value,
            name: document.getElementById('emp-name').value,
            email: document.getElementById('emp-email').value,
            phone: document.getElementById('emp-phone').value,
            department: document.getElementById('emp-dept').value,
            position: document.getElementById('emp-position').value,
            joinDate: document.getElementById('emp-join-date').value,
            status: document.getElementById('emp-status').value
        };

        const isEdit = document.getElementById('emp-id').hasAttribute('data-edit');
        const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employee)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        showNotification('Success', 
            isEdit ? 'Employee updated successfully' : 'Employee added successfully', 
            'success');
        
        hideEmployeeForm();
        await loadEmployees();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}



async function deleteEmployee(id) {
    showLoading();
    try {
        const response = await fetch(`/api/employees/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showNotification('Success', 'Employee deleted successfully', 'success');
        await loadEmployees();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}



async function filterEmployees() {
    const searchTerm = document.getElementById('employee-search').value.trim();
    if (searchTerm.length < 2) {
        await loadEmployees();
        return;
    }

    showLoading();
    try {
        const response = await fetch(`/api/employees/search/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const employees = await response.json();
        renderEmployees(employees);
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function sortEmployees(sortBy) {
    const clickedIcon = document.querySelector(`#employees-table th[data-sort="${sortBy}"] i`);
    let sortOrder = 'asc';
    
    if (clickedIcon.classList.contains('fa-sort-up')) {
        sortOrder = 'desc';
        clickedIcon.classList.remove('fa-sort-up');
        clickedIcon.classList.add('fa-sort-down');
    } else {
        sortOrder = 'asc';
        clickedIcon.classList.remove('fa-sort', 'fa-sort-down');
        clickedIcon.classList.add('fa-sort-up');
    }
    
    loadEmployees(sortBy, sortOrder);
}

// Modal Functions
let currentModalAction = null;
let currentModalData = null;

function showModal(title, message, action, data = null) {
    currentModalAction = action;
    currentModalData = data;
    
    document.getElementById('modal-title').textContent = title;

    // Always treat message as HTML
    document.getElementById('modal-message').innerHTML = message;
    
    document.getElementById('confirmation-modal').classList.remove('hidden');
}


function hideModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    currentModalAction = null;
    currentModalData = null;
}

document.getElementById('modal-confirm').addEventListener('click', function() {
    if (currentModalAction) {
        switch(currentModalAction) {
            case 'deleteEmployee':
                deleteEmployee(currentModalData);
                break;
        }
    }
    hideModal();
});

function confirmDelete(type, id) {
    let title, message;
    
    switch(type) {
        case 'employee':
            title = 'Delete Employee';
            message = 'Are you sure you want to delete this employee? This action cannot be undone.';
            break;
    }
    
    showModal(title, message, `delete${type.charAt(0).toUpperCase() + type.slice(1)}`, id);
}

// Notification Functions
function showNotification(title, message, type) {
    const toast = document.getElementById('notification-toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastTitle = document.getElementById('toast-title');
    const toastText = document.getElementById('toast-text');
    
    // Set content and style based on type
    toastTitle.textContent = title;
    toastText.textContent = message;
    
    // Reset classes
    toast.className = 'toast hidden';
    toastIcon.className = 'fas';
    
    // Add type-specific classes
    switch(type) {
        case 'success':
            toast.classList.add('toast-success');
            toastIcon.classList.add('fa-check-circle');
            break;
        case 'error':
            toast.classList.add('toast-error');
            toastIcon.classList.add('fa-exclamation-circle');
            break;
        case 'warning':
            toast.classList.add('toast-warning');
            toastIcon.classList.add('fa-exclamation-triangle');
            break;
        case 'info':
            toast.classList.add('toast-info');
            toastIcon.classList.add('fa-info-circle');
            break;
    }
    
    // Show toast
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 5000);
}

// Loading Spinner Functions
function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}