const express = require('express');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { FaceClient } = require('@azure/cognitiveservices-face');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');
const fs = require('fs');
const pdf = require('html-pdf');  // Ensure you have installed this package

// Load environment variables
dotenv.config();

const app = express();

// MongoDB connection
mongoose.connect("mongodb+srv://kumarayush0926:V9TNMT5743SC9l02@tara.0gmn5.mongodb.net/tara?retryWrites=true&w=majority")
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const isValidExt = filetypes.test(path.extname(file.originalname).toLowerCase());
        const isValidMime = filetypes.test(file.mimetype);
        cb(isValidExt && isValidMime ? null : 'Error: Invalid file type!');
    }
}).array('photos', 10);  // Allows up to 10 photos for student registration

// Azure Face API setup
const AZURE_FACE_API_KEY = "BLVUWHBQLqgbzDl8KnAyQUPwyccSdDU4QyK5dCrO94zsKGx2vU37JQQJ99ALACGhslBXJ3w3AAAKACOGQEcx"
const AZURE_FACE_ENDPOINT = "https://trackingandrecognitionattendancesystem.cognitiveservices.azure.com/"
const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': AZURE_FACE_API_KEY } });
const faceClient = new FaceClient(credentials, AZURE_FACE_ENDPOINT);

async function getFaceId(imagePath) {
    try {
        const imageStream = fs.createReadStream(imagePath);
        const faces = await faceClient.face.detectWithStream(
            () => imageStream,
            { returnFaceId: true, detectionModel: 'detection_03' }
        );
        if (faces.length === 0) throw new Error('No face detected.');
        return faces[0].faceId;
    } catch (error) {
        console.error('Error in getFaceId:', error);
        throw error;
    }
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Models
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    semester: { type: String, required: true },
    courses: [
        { name: { type: String, required: true }, code: { type: String, required: true } }
    ],
    faceId: { type: String, required: true },
    attendance: [
        {
            courseCode: { type: String, required: true },
            records: [
                { date: { type: Date, required: true }, status: { type: String, enum: ['Present', 'Absent'], required: true } }
            ]
        }
    ]
});

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    courses: [
        { name: { type: String, required: true }, code: { type: String, required: true }, branch: { type: String, required: true } }
    ],
    attendance: [
        { branch: { type: String, required: true }, courseCode: { type: String, required: true }, date: { type: Date, required: true } }
    ]
});

const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);

// Routes
app.get('/', (req, res) => res.render('index'));

app.get('/register', (req, res) => {
    res.render('register', { role: req.query.role || 'student' });
});

app.post('/register', (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).send(`Error: ${err}`);

        const { role, name, email, phone, rollNumber, semester, studentCourses, teacherCourses } = req.body;
        const photos = req.files.map(file => file.path);

        try {
            if (role === 'student') {
                const faceIds = await Promise.all(photos.map(async (photo) => {
                    try {
                        return await getFaceId(photo);
                    } catch (err) {
                        throw new Error(`Face detection failed for image ${photo}: ${err.message}`);
                    }
                }));

                if (faceIds.length === 0) {
                    return res.status(400).send('Error: No face detected in the provided photos.');
                }

                const newStudent = new Student({
                    name,
                    email,
                    phone,
                    rollNumber,
                    semester,
                    courses: studentCourses.map(course => ({
                        name: course.name,
                        code: course.code
                    })),
                    faceId: faceIds[0]  // Use the first photo's faceId
                });
                await newStudent.save();
                res.status(201).send('Student registered successfully');
            } else if (role === 'teacher') {
                const newTeacher = new Teacher({
                    name,
                    email,
                    phone,
                    courses: teacherCourses.map(course => ({
                        name: course.name,
                        code: course.code,
                        branch: course.branch
                    }))
                });
                await newTeacher.save();
                res.status(201).send('Teacher registered successfully');
            } else {
                res.status(400).send('Invalid role');
            }
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).send(`Server error: ${error.message}`);
        }
    });
});

app.get('/student-dashboard', async (req, res) => {
    const student = await Student.findOne({ rollNumber: req.query.rollNumber });
    res.render('student/student-dashboard', { student, role: 'student' });
});

app.get('/teacher-dashboard', async (req, res) => {
    const teacher = await Teacher.findOne({ email: req.query.email });
    res.render('teacher/teacher-dashboard', { teacher, role: 'teacher' });
});

app.get('/generate-student-report-pdf', async (req, res) => {
    const { rollNumber, courseCode, month, year } = req.query;
    const student = await Student.findOne({ rollNumber });

    const reportData = `<h1>Attendance Report for ${courseCode}</h1>
                        <p>Month: ${month}, Year: ${year}</p>
                        <table border="1">
                            <thead><tr><th>Date</th><th>Status</th></tr></thead>
                            <tbody>${student.attendance
                                .filter(record => {
                                    const d = new Date(record.date);
                                    return d.getMonth() + 1 == month && d.getFullYear() == year && record.courseCode === courseCode;
                                })
                                .map(record => `<tr><td>${record.date.toISOString().slice(0, 10)}</td><td>${record.status}</td></tr>`)
                                .join('')}</tbody>
                        </table>`;

    pdf.create(reportData).toFile('./uploads/report.pdf', (err, result) => {
        if (err) return res.status(500).send('Error generating PDF');
        res.download(result.filename);
    });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
