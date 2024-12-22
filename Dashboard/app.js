const express = require('express');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');
const pdf = require('html-pdf');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/tara', { useNewUrlParser: true, useUnifiedTopology: true });



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
}).array('photos', 10); // Accept up to 10 photos

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
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

// Routes

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Register route
app.get('/register', (req, res) => {
    const role = req.query.role || 'student'; // default to student if role is not provided
    res.render('register', { role });
});

app.post('/register', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send(`Error: ${err.message}`);
        }

        const { role, name, email, phone, branch, rollNumber, semester, studentCourses, teacherCourses } = req.body;
        const photos = req.files.map(file => file.path);

        try {
            if (role === 'student') {
                const newStudent = new Student({ name, email, phone, branch, rollNumber, semester, courses: studentCourses, photos });
                await newStudent.save();
                res.status(201).send('Student registered successfully');
            } else if (role === 'teacher') {
                const newTeacher = new Teacher({ name, email, phone, branch, courses: teacherCourses, photos });
                await newTeacher.save();
                res.status(201).send('Teacher registered successfully');
            } else {
                res.status(400).send('Invalid role');
            }
        } catch (error) {
            console.error('Error registering:', error.message);
            res.status(500).send('Server error');
        }
    });
});

// Student dashboard route
app.get('/student-dashboard', async (req, res) => {
    const student = await Student.findOne({ rollNumber: req.query.rollNumber });
    res.render('student/student-dashboard', { student, role: 'student' });
});

// Teacher dashboard route
app.get('/teacher-dashboard', async (req, res) => {
    const teacher = await Teacher.findOne({ email: req.query.email });
    res.render('teacher/teacher-dashboard', { teacher, role: 'teacher' });
});

// Attendance report route
app.get('/attendance-report', async (req, res) => {
    const role = req.query.role;
    if (role === 'student') {
        const student = await Student.findOne({ rollNumber: req.query.rollNumber });
        res.render('student/studentReport', { student });
    } else {
        const teacher = await Teacher.findOne({ email: req.query.email });
        res.render('teacher/teacherReport', { teacher });
    }
});

// Reminder route
app.get('/reminder', async (req, res) => {
    const userRole = req.query.role;
    let upcomingClasses = [];

    if (userRole === 'student') {
        const student = await Student.findOne({ rollNumber: req.query.rollNumber });
        upcomingClasses = student.courses;
    } else if (userRole === 'teacher') {
        const teacher = await Teacher.findOne({ email: req.query.email });
        upcomingClasses = teacher.courses;
    }

    res.render('reminder', { user: { role: userRole }, upcomingClasses });
});

// Messages route
app.get('/messages', (req, res) => {
    const userRole = req.query.role;
    res.render('messages', { role: userRole, messages });
});

// User Profile route
app.get('/user-profile', async (req, res) => {
    const role = req.query.role;
    if (role === 'student') {
        const student = await Student.findOne({ rollNumber: req.query.rollNumber });
        res.render('user', { role, student });
    } else if (role === 'teacher') {
        const teacher = await Teacher.findOne({ email: req.query.email });
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
    upload.single('attachment')(req, res, (err) => {
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
    console.log(`Feedback received from ${name} (${rollNumber}, ${email}): ${feedback}`);
    res.send('Feedback submitted successfully');
});

// Generate Student Report as PDF
app.get('/generate-student-report-pdf', async (req, res) => {
    const { courseCode, month, year, rollNumber } = req.query;
    const student = await Student.findOne({ rollNumber });
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
app.get('/api/student-attendance', async (req, res) => {
    const { rollNumber, courseCode, month, year } = req.query;

    const student = await Student.findOne({ rollNumber });
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
