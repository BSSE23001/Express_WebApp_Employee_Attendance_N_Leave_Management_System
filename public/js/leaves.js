document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000);
    setupEventListeners();
    loadLeaveRequests();
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    
    // Set default dates
    const dateString = now.toISOString().split('T')[0];
    document.getElementById('leave-start').value = dateString;
    document.getElementById('leave-end').value = dateString;
}

function setupEventListeners() {    
    // Sidebar navigation
    document.querySelectorAll('.app-sidebar nav li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showPage(section);
        });
    });
    
    // Leave management buttons
    document.getElementById('request-leave-btn').addEventListener('click', showLeaveForm);
    document.getElementById('cancel-leave-btn').addEventListener('click', hideLeaveForm);
    document.getElementById('leave-form').addEventListener('submit', submitLeaveRequest);
    document.getElementById('leave-search').addEventListener('input', filterLeaveRequests);
    document.getElementById('leave-status-filter').addEventListener('change', filterLeaveRequests);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', hideModal);
    document.getElementById('modal-cancel').addEventListener('click', hideModal);
}

// Form Management
async function showLeaveForm() {
    showLoading();
    try {
        // Get active employees
        const response = await fetch('/api/employees?status=Active');
        if (!response.ok) throw new Error('Failed to load employees');
        
        const employees = await response.json();
        const employeeSelect = document.getElementById('leave-employee');
        
        employeeSelect.innerHTML = '';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.name} (${employee.id})`;
            employeeSelect.appendChild(option);
        });
        
        document.getElementById('leave-form-container').classList.remove('hidden');
        document.getElementById('leave-form').reset();
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.getElementById('request-leave-btn').classList.add('hidden');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function hideLeaveForm() {
    document.getElementById('leave-form-container').classList.add('hidden');
    document.getElementById('request-leave-btn').classList.remove('hidden');
}

async function submitLeaveRequest(e) {
    e.preventDefault();
    
    if (!validateLeaveForm()) return;
    
    showLoading();
    
    try {
        const leaveRequest = {
            employeeId: document.getElementById('leave-employee').value,
            leaveType: document.getElementById('leave-type').value,
            startDate: document.getElementById('leave-start').value,
            endDate: document.getElementById('leave-end').value,
            reason: document.getElementById('leave-reason').value
        };
        
        const response = await fetch('/api/leaves', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leaveRequest)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showNotification('Success', 'Leave request submitted successfully', 'success');
        hideLeaveForm();
        await loadLeaveRequests();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function validateLeaveForm() {
    let isValid = true;
    const startDate = document.getElementById('leave-start').value;
    const endDate = document.getElementById('leave-end').value;
    const reason = document.getElementById('leave-reason').value;
    
    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Validate dates
    if (!startDate) {
        document.getElementById('leave-start-error').textContent = 'Start date is required';
        isValid = false;
    }
    
    if (!endDate) {
        document.getElementById('leave-end-error').textContent = 'End date is required';
        isValid = false;
    } else if (startDate && endDate < startDate) {
        document.getElementById('leave-end-error').textContent = 'End date must be after start date';
        isValid = false;
    }
    
    // Validate reason
    if (!reason) {
        document.getElementById('leave-reason-error').textContent = 'Reason is required';
        isValid = false;
    } else if (reason.length < 10) {
        document.getElementById('leave-reason-error').textContent = 'Reason must be at least 10 characters';
        isValid = false;
    }
    
    return isValid;
}

async function loadLeaveRequests() {
    showLoading();
    try {
        const statusFilter = document.getElementById('leave-status-filter').value;
        const searchTerm = document.getElementById('leave-search').value.toLowerCase();
        
        let url = '/api/leaves?';
        if (statusFilter !== 'all') url += `status=${statusFilter}&`;
        if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load leave requests');
        
        const leaveRequests = await response.json();
        renderLeaveRequests(leaveRequests);
    } catch (error) {
        showNotification('Error', error.message, 'error');
        renderLeaveRequests([]);
    } finally {
        hideLoading();
    }
}

function renderLeaveRequests(leaveRequests) {
    const tableBody = document.getElementById('leave-table-body');
    tableBody.innerHTML = '';
    
    if (leaveRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No leave requests found</td></tr>';
        return;
    }
    
    leaveRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id || request._id}</td>
            <td>${request.employeeName}</td>
            <td>${request.leaveType}</td>
            <td>${formatDateRange(request.startDate, request.endDate)}</td>
            <td>${request.days}</td>
            <td><span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span></td>
            <td>${new Date(request.submittedDate).toLocaleDateString()}</td>
            <td class="table-actions">
                ${request.status === 'Pending' ? `
                    <button class="action-btn approve-btn" data-id="${request._id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn reject-btn" data-id="${request._id}">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
                <button class="action-btn view-btn" data-id="${request._id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${request._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => updateLeaveStatus(btn.getAttribute('data-id'), 'Approved'));
    });
    
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => updateLeaveStatus(btn.getAttribute('data-id'), 'Rejected'));
    });
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewLeaveRequest(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmDeleteLeave(btn.getAttribute('data-id')));
    });
}

function filterLeaveRequests() {
    loadLeaveRequests();
}

function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString();
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

async function updateLeaveStatus(leaveId, status) {
    showLoading();
    try {
        const response = await fetch(`/api/leaves/${leaveId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showNotification('Success', `Leave request ${status.toLowerCase()}`, 'success');
        await loadLeaveRequests();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function viewLeaveRequest(leaveId) {
    showLoading();
    try {
        const response = await fetch(`/api/leaves/${leaveId}`);
        if (!response.ok) throw new Error('Failed to load leave request');
        
        const request = await response.json();
        
        showModal(
            'Leave Request Details',
            `
            <div class="leave-details">
                <div class="detail-row">
                    <span class="detail-label">Employee:</span>
                    <span class="detail-value">${request.employeeName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Leave Type:</span>
                    <span class="detail-value">${request.leaveType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dates:</span>
                    <span class="detail-value">${formatDateRange(request.startDate, request.endDate)} (${request.days} days)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-badge status-${request.status.toLowerCase()}">${request.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Submitted On:</span>
                    <span class="detail-value">${new Date(request.submittedDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row full-width">
                    <span class="detail-label">Reason:</span>
                    <p class="detail-value">${request.reason}</p>
                </div>
            </div>
            `,
            'viewLeave'
        );
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

function confirmDeleteLeave(leaveId) {
    showModal(
        'Delete Leave Request',
        'Are you sure you want to delete this leave request? This action cannot be undone.',
        'deleteLeave',
        leaveId
    );
}

async function deleteLeave(leaveId) {
    showLoading();
    try {
        const response = await fetch(`/api/leaves/${leaveId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showNotification('Success', 'Leave request deleted successfully', 'success');
        await loadLeaveRequests();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    } finally {
        hideLoading();
    }
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

// Modal Functions
let currentModalAction = null;
let currentModalData = null;

function showModal(title, message, action, data = null) {
    currentModalAction = action;
    currentModalData = data;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').innerHTML = message;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    currentModalAction = null;
    currentModalData = null;
}

document.getElementById('modal-confirm').addEventListener('click', function() {
    if (currentModalAction === 'deleteLeave') {
        deleteLeave(currentModalData);
    }
    hideModal();
});

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