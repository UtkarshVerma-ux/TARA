const express = require('express');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');
const pdf = require('html-pdf');

dotenv.config();

const app = express();

// Set storage engine for multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('attachment');

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Invalid file type!');
    }
}

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Example data
let messages = [
    {
        sender: "Prof. Jane Smith",
        text: "Please review the attached assignment.",
        attachment: "/uploads/example-assignment.pdf"
    },
    {
        sender: "Prof. Jane Smith",
        text: "Don't forget to submit your project by the end of the week.",
        attachment: null
    }
];

const students = [
    {
        name: "John Doe",
        rollNumber: "215/ics/018",
        branch: "Computer Science",
        semester: "5",
        attendance: {
            "2023-09-01": "present",
            "2023-09-02": "absent",
        },
        courses: [
            { name: "Mathematics", code: "CS101" },
            { name: "Physics", code: "CS102" }
        ],
        notices: ["Assignment due on Friday", "New course materials available"],
        upcomingClasses: [
            { course: "Mathematics", date: "2023-09-25", time: "10:00 AM", classroom: "Room 101" },
            { course: "Physics", date: "2023-09-25", time: "2:00 PM", classroom: "Room 202" }
        ]
    }
];

const teachers = [
    {
        name: "Prof. Jane Smith",
        branch: "Computer Science",
        classesTaken: 120,
        courses: [
            { name: "Mathematics", code: "CS101" },
            { name: "Physics", code: "CS102" }
        ],
        upcomingClasses: [
            { course: "Mathematics", date: "2023-09-25", time: "10:00 AM", branch: "Computer Science", classroom: "Room 101" },
            { course: "Physics", date: "2023-09-25", time: "2:00 PM", branch: "Computer Science", classroom: "Room 202" }
        ],
        notices: ["Staff meeting on Tuesday", "Submit grades by Friday"]
    }
];

// Routes

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Student dashboard route
app.get('/student-dashboard', (req, res) => {
    const student = students[0];
    res.render('student/student-dashboard', { student, role: 'student' });
});

// Teacher dashboard route
app.get('/teacher-dashboard', (req, res) => {
    const teacher = teachers[0];
    res.render('teacher/teacher-dashboard', { teacher, role: 'teacher' });
});

// Attendance report route
app.get('/attendance-report', (req, res) => {
    const role = req.query.role;
    if (role === 'student') {
        res.render('student/studentReport', { student: students[0] });
    } else {
        res.render('teacher/teacherReport', { teacher: teachers[0] });
    }
});

// Reminder route
app.get('/reminder', (req, res) => {
    const userRole = req.query.role;
    let upcomingClasses = [];

    if (userRole === 'student') {
        upcomingClasses = students[0].upcomingClasses;
    } else if (userRole === 'teacher') {
        upcomingClasses = teachers[0].upcomingClasses;
    }

    res.render('reminder', { user: { role: userRole }, upcomingClasses });
});

// Messages route
app.get('/messages', (req, res) => {
    const userRole = req.query.role;
    res.render('messages', { role: userRole, messages });
});

// User Profile route
app.get('/user-profile', (req, res) => {
    const role = req.query.role; // Retrieve the role from query parameters
    if (role === 'student') {
        const student = students[0]; // Replace with logic to fetch the correct student
        res.render('user', { role, student });
    } else if (role === 'teacher') {
        const teacher = teachers[0]; // Replace with logic to fetch the correct teacher
        res.render('user', { role, teacher });
    } else {
        res.status(400).send("Invalid role specified");
    }
});

// Contact Us route
app.get('/contact-us', (req, res) => {
    res.render('contact-us', { role: req.query.role });
});

// Handle form submission for sending messages
app.post('/send-message', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.send(`Error: ${err.message}`);
        }
        const { message } = req.body;
        const sender = req.query.role === 'teacher' ? "Prof. Jane Smith" : "Unknown";
        const attachment = req.file ? `/uploads/${req.file.filename}` : null;

        messages.push({ sender, text: message, attachment });
        res.redirect(`/messages?role=${req.query.role}`);
    });
});

// Handle feedback submission
app.post('/submit-feedback', (req, res) => {
    const { name, rollNumber, email, feedback } = req.body;
    // You can add code here to save the feedback to a database or process it further
    console.log(`Feedback received from ${name} (${rollNumber}, ${email}): ${feedback}`);
    res.send('Feedback submitted successfully');
});

// Generate Student Report as PDF
app.get('/generate-student-report-pdf', (req, res) => {
    const { courseCode, month, year } = req.query;
    const student = students[0];
    const attendance = student.attendance;

    let reportData = `<h1>Attendance Report for Course: ${courseCode}</h1>
                      <p>Month: ${month} Year: ${year}</p>
                      <table border="1">
                          <thead>
                              <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                              </tr>
                          </thead>
                          <tbody>`;

    for (const [date, status] of Object.entries(attendance)) {
        const d = new Date(date);
        if (d.getMonth() + 1 == month && d.getFullYear() == year) {
            reportData += `<tr><td>${date}</td><td>${status}</td></tr>`;
        }
    }

    reportData += `</tbody></table>`;

    pdf.create(reportData).toFile('./uploads/student-attendance-report.pdf', (err, result) => {
        if (err) {
            return res.send(`PDF generation failed: ${err}`);
        }
        res.download(result.filename);
    });
});

// API to get student attendance data for a specific course, month, and year
app.get('/api/student-attendance', (req, res) => {
    const { rollNumber, courseCode, month, year } = req.query;

    const student = students.find(s => s.rollNumber === rollNumber);
    if (!student) {
        return res.status(404).json({ error: "Student not found" });
    }

    const filteredAttendance = {};
    const attendance = student.attendance;

    for (const [date, status] of Object.entries(attendance)) {
        const d = new Date(date);
        if (d.getMonth() + 1 == month && d.getFullYear() == year) {
            filteredAttendance[date] = status;
        }
    }

    if (Object.keys(filteredAttendance).length === 0) {
        return res.status(404).json({ error: "No attendance records found for the given criteria" });
    }

    res.json({ courseCode, month, year, attendance: filteredAttendance });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
