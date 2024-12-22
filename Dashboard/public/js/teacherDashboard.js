document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission to view number of classes taken in a specific branch, month, and year
    document.getElementById('class-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const branch = document.getElementById('branch').value;
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;

        fetch(`/api/teacher-classes?branch=${branch}&month=${month}&year=${year}`)
            .then(response => response.json())
            .then(data => {
                const { classesTaken, courses } = data;
                const classDetails = document.getElementById('classDetails');
                const noClassMessage = document.getElementById('no-class-message');

                // Clear previous class details
                classDetails.innerHTML = '';

                // Check if class data exists
                if (classesTaken > 0) {
                    // Hide no class message
                    noClassMessage.style.display = 'none';

                    // Display class details
                    classDetails.innerHTML = `<p>Classes Taken: ${classesTaken}</p>`;
                    if (courses.length > 0) {
                        const courseList = courses.map(course => `<li>${course.name}</li>`).join('');
                        classDetails.innerHTML += `<ul>${courseList}</ul>`;
                    } else {
                        classDetails.innerHTML += `<p>No classes found for the selected criteria.</p>`;
                    }
                } else {
                    // Show no class message
                    noClassMessage.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching class data:', error));
    });
});
