document.addEventListener('DOMContentLoaded', function() {
    // Fetch total attendance data for the pie chart
    fetch('/api/student-total-attendance')
        .then(response => response.json())
        .then(data => {
            const { presentDays, absentDays } = data;
            // Verify data
            console.log('Total Attendance Data:', data);
            // Attendance Chart
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Present', 'Absent'],
                    datasets: [{
                        data: [presentDays, absentDays],
                        backgroundColor: ['#4caf50', '#f44336']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false // Ensure the chart maintains aspect ratio
                }
            });
        })
        .catch(error => console.error('Error fetching total attendance data:', error));

    // Handle form submission to view attendance for a specific course, month, and year
    document.getElementById('attendance-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const courseCode = document.getElementById('courseCode').value;
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;
        
        fetch(`/api/student-attendance?courseCode=${courseCode}&month=${month}&year=${year}`)
            .then(response => response.json())
            .then(attendance => {
                // Verify data
                console.log('Attendance Data:', attendance);

                // Calendar element
                const calendarEl = document.getElementById('calendar');
                const noAttendanceMessage = document.getElementById('no-attendance-message');

                // Clear previous calendar
                calendarEl.innerHTML = '';

                // Check if attendance data exists
                if (Object.keys(attendance).length > 0) {
                    // Hide no attendance message
                    noAttendanceMessage.style.display = 'none';

                    // Create and render calendar
                    const calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: 'dayGridMonth',
                        events: Object.entries(attendance).map(([date, status]) => ({
                            title: status === 'present' ? 'Present' : 'Absent',
                            start: date,
                            color: status === 'present' ? 'green' : 'red'
                        }))
                    });
                    calendar.render();
                } else {
                    // Show no attendance message
                    noAttendanceMessage.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching attendance data:', error));
    });
});
