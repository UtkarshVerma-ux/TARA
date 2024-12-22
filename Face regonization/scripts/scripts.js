// JavaScript for Camera Access Page
if (document.getElementById('video')) {
    const video = document.getElementById('video');

    // Access the device camera and stream to video element
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error('Error accessing webcam:', err);
        });

    document.getElementById('capture').addEventListener('click', () => {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        document.getElementById('image').value = dataUrl;
    });

    document.getElementById('uploadForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const response = await fetch('/mark-attendance', {
            method: 'POST',
            body: formData
        });
        const data = await response.text();
        alert(data);
    });
}

// JavaScript for Teacher Login Page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const response = await fetch('/verify-teacher', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            const urlParams = new URLSearchParams(formData);
            window.location.href = `/camera-access?${urlParams.toString()}`;
        } else {
            alert('Invalid login credentials');
        }
    });
}
