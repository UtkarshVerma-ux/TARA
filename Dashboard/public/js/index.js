function showLoginForm() {
    const teacherRadio = document.getElementById('teacher');
    const studentRadio = document.getElementById('student');
    const radios = document.querySelectorAll('input[name="role"]');
    const submitButton = document.querySelector('.login-form button');

    if (teacherRadio.checked) {
        document.getElementById('teacher-form').style.display = 'block';
        document.getElementById('student-form').style.display = 'none';
    } else if (studentRadio.checked) {
        document.getElementById('student-form').style.display = 'block';
        document.getElementById('teacher-form').style.display = 'none';
    } else {
        alert('Please select an option to proceed!');
        return;
    }

    // Disable radio buttons and submit button when a form is displayed
    radios.forEach(radio => radio.disabled = true);
    submitButton.disabled = true;
}

function cancelForm() {
    document.getElementById('teacher-form').style.display = 'none';
    document.getElementById('student-form').style.display = 'none';

    const radios = document.querySelectorAll('input[name="role"]');
    const submitButton = document.querySelector('.login-form button');

    // Enable radio buttons and submit button when forms are closed
    radios.forEach(radio => radio.disabled = false);
    submitButton.disabled = false;
}

function getOtp(usernameId) {
    const username = document.getElementById(usernameId).value;
    if (username) {
        alert(`OTP has been sent to the email: ${username}`);
        // Implement the actual OTP request logic here
    } else {
        alert('Please enter your email ID to receive the OTP.');
    }
}
