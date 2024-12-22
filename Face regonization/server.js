const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const { Buffer } = require('buffer');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for teachers
const teachers = [
    {
        email: 'jane.smith@university.com',
        branch: 'Computer Science',
        courseName: 'Mathematics',
        courseCode: 'CS101',
        date: '2023-12-22'
    }
];

// Serve login page
app.get('/teacher-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Verify teacher credentials
app.post('/verify-teacher', (req, res) => {
    const { email, branch, courseName, courseCode, date } = req.body;

    // Validate login credentials
    const teacher = teachers.find(t => t.email === email && t.branch === branch && t.courseName === courseName && t.courseCode === courseCode);
    if (teacher) {
        // Redirect to camera access page with query parameters
        res.redirect(`/camera-access?email=${email}&branch=${branch}&courseName=${courseName}&courseCode=${courseCode}&date=${date}`);
    } else {
        res.status(400).send('Invalid login credentials');
    }
});

// Serve camera access page
app.get('/camera-access', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'camera-access.html'));
});

// Handle attendance marking
app.post('/mark-attendance', (req, res) => {
    const { email, branch, courseName, courseCode, date, image } = req.body;

    const imageData = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Mock data for students
    const students = [
        { id: '1', name: 'Student A', faceId: 'stored_face_id_1' },
        { id: '2', name: 'Student B', faceId: 'stored_face_id_2' }
    ];

    const subscriptionKey = 'YOUR_FACE_API_KEY';
    const endpoint = 'YOUR_FACE_API_ENDPOINT';

    // Function to get stored face ID
    function getStoredFaceId(studentId) {
        const student = students.find(s => s.id === studentId);
        return student ? student.faceId : null;
    }

    // Function to mark attendance
    function markAttendance(studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const today = new Date().toISOString().split('T')[0];
        if (!student.attendance) student.attendance = {};
        student.attendance[today] = 'present';

        console.log(`Attendance marked for student ${student.name} on ${today}`);
    }

    // Detect and verify faces
    axios.post(`${endpoint}/detect`, imageBuffer, {
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/octet-stream'
        },
        params: {
            returnFaceId: true
        }
    })
        .then(response => {
            const faces = response.data;
            if (faces.length === 0) {
                return res.status(400).send('No faces detected');
            }

            let attendanceMarked = 0;

            // Compare detected face IDs with stored face IDs
            const verificationPromises = faces.map(face => {
                const detectedFaceId = face.faceId;

                return Promise.all(students.map(student => {
                    const storedFaceId = student.faceId;

                    return axios.post(`${endpoint}/verify`, {
                        faceId1: detectedFaceId,
                        faceId2: storedFaceId
                    }, {
                        headers: {
                            'Ocp-Apim-Subscription-Key': subscriptionKey,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(verificationResponse => {
                            const verificationResult = verificationResponse.data;

                            if (verificationResult.isIdentical) {
                                markAttendance(student.id);
                                attendanceMarked++;
                            }
                        });
                }));
            });

            // Wait for all verifications to complete
            Promise.all(verificationPromises)
                .then(() => {
                    if (attendanceMarked > 0) {
                        res.send(`Attendance marked for ${attendanceMarked} students`);
                    } else {
                        res.status(400).send('Face verification failed for all detected faces');
                    }
                })
                .catch(error => {
                    console.error('Error processing face verification:', error.message);
                    res.status(500).send('Face verification failed');
                });
        })
        .catch(error => {
            console.error('Error detecting faces:', error.message);
            res.status(500).send('Face detection failed');
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
