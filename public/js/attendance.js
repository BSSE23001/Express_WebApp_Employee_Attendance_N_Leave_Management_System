document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000);
    setupEventListeners();
    loadEmployeesForAttendance();
    loadAttendanceData();
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    
    // Set default date
    const dateString = now.toISOString().split('T')[0];
    document.getElementById('attendance-date').value = dateString;
    document.getElementById('attendance-date-input').value = dateString;
}

function setupEventListeners() {    
    // Sidebar navigation
    document.querySelectorAll('.app-sidebar nav li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showPage(section);
        });
    });
    
    // Attendance controls
    document.getElementById('attendance-date').addEventListener('change', loadAttendanceData);
    document.getElementById('attendance-search').addEventListener('input', filterEmployees);
    document.getElementById('cancel-attendance-btn').addEventListener('click', hideAttendanceForm);
    document.getElementById('attendance-form').addEventListener('submit', saveAttendance);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', hideModal);
    document.getElementById('modal-cancel').addEventListener('click', hideModal);
}


function showAttendanceForm(employee) {
    // Store the employee data in data attributes
    const form = document.getElementById('attendance-form');
    form.dataset.employeeId = employee._id;
    
    // Fill visible form fields
    document.getElementById('attendance-employee-id').value = employee.id;
    document.getElementById('attendance-employee-name').value = employee.name;
    
    // Set current date
    const dateInput = document.getElementById('attendance-date');
    document.getElementById('attendance-date-input').value = dateInput.value;
    
    // Reset status and times
    document.getElementById('attendance-status').value = 'Present';
    document.getElementById('attendance-checkin').value = '09:00';
    document.getElementById('attendance-checkout').value = '17:00';
    
    // Show form
    document.getElementById('attendance-form-container').classList.remove('hidden');
}


function hideAttendanceForm() {
    document.getElementById('attendance-form-container').classList.add('hidden');
}

async function loadEmployeesForAttendance() {
    showLoading();
    try {
        const response = await fetch('/api/attendance/employees');
        if (!response.ok) throw new Error('Failed to load employees');
        
        const employees = await response.json();
        renderEmployeesTable(employees);
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderEmployeesTable(employees) {
    const tableBody = document.getElementById('employees-table-body');
    tableBody.innerHTML = '';
    
    if (employees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No employees found</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${employee.position}</td>
            <td class="table-actions">
                <button class="action-btn mark-attendance-btn" data-id="${employee.id}" data-name="${employee.name}">
                    <i class="fas fa-calendar-check"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to mark attendance buttons
    document.querySelectorAll('.mark-attendance-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const employee = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name')
            };
            showAttendanceForm(employee);
        });
    });
}

async function loadAttendanceData() {
    showLoading();
    try {
        const date = document.getElementById('attendance-date').value;
        const response = await fetch(`/api/attendance/date/${date}`);
        
        if (!response.ok) throw new Error('Failed to load attendance data');
        
        const attendanceData = await response.json();
        renderAttendanceTable(attendanceData);
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderAttendanceTable(attendanceData) {
    const tableBody = document.getElementById('attendance-table-body');
    tableBody.innerHTML = '';
    
    if (attendanceData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No attendance records found</td></tr>';
        return;
    }
    
    attendanceData.forEach(record => {
        const employee = record.employee;
        const date = new Date(record.date).toISOString().split('T')[0];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${date}</td>
            <td>${record.status}</td>
            <td>${record.checkIn || '--:--'}</td>
            <td>${record.checkOut || '--:--'}</td>
            <td class="table-actions">
                <button class="action-btn delete-btn" data-id="${record._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmDeleteAttendance(btn.getAttribute('data-id'));
        });
    });
}

function filterEmployees() {
    const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
    const rows = document.querySelectorAll('#employees-table-body tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const dept = row.cells[2].textContent.toLowerCase();
        const position = row.cells[3].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || dept.includes(searchTerm) || position.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}


async function saveAttendance(e) {
    e.preventDefault();
    showLoading();
    
    try {
        const employeeId = document.getElementById('attendance-employee-id').value;
        const date = document.getElementById('attendance-date-input').value;
        const status = document.getElementById('attendance-status').value;
        const checkIn = document.getElementById('attendance-checkin').value;
        const checkOut = document.getElementById('attendance-checkout').value;
        
        // First get the full employee document
        const employeeResponse = await fetch(`/api/employees/id/${employeeId}`);
        if (!employeeResponse.ok) throw new Error('Employee not found');
        
        const employee = await employeeResponse.json();
        if (!employee) throw new Error('Employee not found');
        
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employeeId: employee._id, // Use the MongoDB _id
                date,
                status,
                checkIn: status === 'Present' ? checkIn : null,
                checkOut: status === 'Present' ? checkOut : null
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save attendance');
        }
        
        showNotification('Success', 'Attendance recorded successfully', 'success');
        
        hideAttendanceForm();
        await loadAttendanceData();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function confirmDeleteAttendance(attendanceId) {
    showModal(
        'Delete Attendance Record',
        'Are you sure you want to delete this attendance record?',
        'deleteAttendance',
        attendanceId
    );
}

async function deleteAttendance(attendanceId) {
    showLoading();
    try {
        const response = await fetch(`/api/attendance/${attendanceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showNotification('Success', 'Attendance record deleted successfully', 'success');
        await loadAttendanceData();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Modal Functions
let currentModalAction = null;
let currentModalData = null;

function showModal(title, message, action, data = null) {
    currentModalAction = action;
    currentModalData = data;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    currentModalAction = null;
    currentModalData = null;
}

document.getElementById('modal-confirm').addEventListener('click', function() {
    if (currentModalAction === 'deleteAttendance') {
        deleteAttendance(currentModalData);
    }
    hideModal();
});


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