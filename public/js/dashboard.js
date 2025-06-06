document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

async function initApp() {
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000);
    setupEventListeners();
    initCharts();
    await updateDashboard();
}

function setupEventListeners() {    
    document.querySelectorAll('.app-sidebar nav li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showPage(section);
        });
    });
}

function showPage(sectionId) {
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

async function updateDashboard() {
    try {
        // Fetch all dashboard data in parallel
        const [stats, recentLeaves, chartData] = await Promise.all([
            fetch('/dashboard/stats').then(res => res.json()),
            fetch('/dashboard/recent-leaves').then(res => res.json()),
            fetch('/dashboard/chart-data').then(res => res.json())
        ]);

        // Update stats
        document.getElementById('total-employees').textContent = stats.totalEmployees;
        document.getElementById('present-today').textContent = stats.presentToday;
        document.getElementById('on-leave').textContent = stats.onLeave;
        document.getElementById('absent-today').textContent = stats.absentToday;
        
        // Update recent leaves
        updateRecentLeaves(recentLeaves);
        
        // Update charts
        updateCharts(chartData);
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function updateRecentLeaves(leaveRequests) {
    const recentLeavesContainer = document.getElementById('recent-leaves');
    recentLeavesContainer.innerHTML = '';
    
    if (leaveRequests.length === 0) {
        recentLeavesContainer.innerHTML = '<p class="text-muted">No recent leave requests</p>';
        return;
    }
    
    leaveRequests.forEach(request => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon" style="background-color: ${getStatusColor(request.status)};">
                <i class="fas ${getStatusIcon(request.status)}"></i>
            </div>
            <div class="activity-info">
                <p class="activity-title">${request.employeeName}</p>
                <p class="activity-desc">${request.leaveType} - ${request.days} days</p>
            </div>
            <div class="activity-time">${new Date(request.submittedDate).toLocaleDateString()}</div>
        `;
        recentLeavesContainer.appendChild(activityItem);
    });
}


function getStatusColor(status) {
    switch(status) {
        case 'Approved': return '#1cc88a';
        case 'Rejected': return '#e74a3b';
        default: return '#f6c23e';
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'Approved': return 'fa-check';
        case 'Rejected': return 'fa-times';
        default: return 'fa-clock';
    }
}


// Chart Functions
function initCharts() {
    // Initialize chart contexts
    window.attendanceChart = new Chart(
        document.getElementById('attendance-chart').getContext('2d'),
        { type: 'bar', data: { labels: [], datasets: [] }, options: getChartOptions('Attendance') }
    );
    
    window.leaveChart = new Chart(
        document.getElementById('leave-chart').getContext('2d'),
        { type: 'pie', data: { labels: [], datasets: [] }, options: getChartOptions('Leave Types') }
    );
    
}

function getChartOptions(title) {
    return {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16
                }
            }
        }
    };
}


function updateCharts(chartData) {
    // Update attendance chart
    window.attendanceChart.data.labels = chartData.attendanceChart.labels;
    window.attendanceChart.data.datasets = [
        {
            label: 'Present',
            data: chartData.attendanceChart.presentData,
            backgroundColor: '#1cc88a',
            borderColor: '#1cc88a',
            borderWidth: 1
        },
        {
            label: 'Absent',
            data: chartData.attendanceChart.absentData,
            backgroundColor: '#e74a3b',
            borderColor: '#e74a3b',
            borderWidth: 1
        }
    ];
    window.attendanceChart.update();
    
    // Update leave chart
    const leaveTypes = chartData.leaveChart.map(item => item.leaveType);
    const typeCounts = chartData.leaveChart.map(item => item.count);
    
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
    ].slice(0, leaveTypes.length);
    
    window.leaveChart.data.labels = leaveTypes;
    window.leaveChart.data.datasets = [{
        data: typeCounts,
        backgroundColor: backgroundColors,
        borderWidth: 1
    }];
    window.leaveChart.update();
}