function previewPhotos() {
    const preview = document.getElementById('photos-preview');
    const files = document.getElementById('photos').files;
    preview.innerHTML = '';
    if (files) {
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'img-preview';
                imgDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Photo">
                    <button type="button" onclick="removePhoto(${index})">Remove</button>
                `;
                preview.appendChild(imgDiv);
            };
            reader.readAsDataURL(file);
        });
    }
}

function removePhoto(index) {
    const photosInput = document.getElementById('photos');
    const dt = new DataTransfer();
    const files = Array.from(photosInput.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    photosInput.files = dt.files;
    previewPhotos();
}

let studentCourseCount = 1;
function addStudentCourse() {
    const studentCoursesDiv = document.getElementById('student-courses');
    const newCourseDiv = document.createElement('div');
    newCourseDiv.innerHTML = `
        <label for="student-course-${studentCourseCount}">Course Name:</label>
        <input type="text" id="student-course-${studentCourseCount}" name="studentCourses[${studentCourseCount}][name]" required>
        <label for="studentCourseCode-${studentCourseCount}">Course Code:</label>
        <input type="text" id="studentCourseCode-${studentCourseCount}" name="studentCourses[${studentCourseCount}][code]" required>
    `;
    studentCoursesDiv.appendChild(newCourseDiv);
    studentCourseCount++;
}

let teacherCourseCount = 1;
function addTeacherCourse() {
    const teacherCoursesDiv = document.getElementById('teacher-courses');
    const newCourseDiv = document.createElement('div');
    newCourseDiv.innerHTML = `
        <label for="teacher-course-${teacherCourseCount}">Course Name:</label>
        <input type="text" id="teacher-course-${teacherCourseCount}" name="teacherCourses[${teacherCourseCount}][name]" required>
        <label for="teacherCourseCode-${teacherCourseCount}">Course Code:</label>
        <input type="text" id="teacherCourseCode-${teacherCourseCount}" name="teacherCourses[${teacherCourseCount}][code]" required>
        <label for="teacherBranch-${teacherCourseCount}">Branch:</label>
        <input type="text" id="teacherBranch-${teacherCourseCount}" name="teacherCourses[${teacherCourseCount}][branch]" required>
    `;
    teacherCoursesDiv.appendChild(newCourseDiv);
    teacherCourseCount++;
}
