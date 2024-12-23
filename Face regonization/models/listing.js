const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://kumarayush0926:V9TNMT5743SC9l02@tara.0gmn5.mongodb.net/tara?retryWrites=true&w=majority").then(()=>{
    console.log("connected successfully");
    
});
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    faceId: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    semester: {
        type: String,
        required: true
    },
    courses: [
        {
            name: { type: String, required: true },
            code: { type: String, required: true }
        }
    ]
})

const teacherSchema = new Schema({
    name: { 
        type: String,
        required: true 
    },
    email: { 
        type: String, required: true,
        unique: true 
    },
    phone: { 
        type: String,
        required: true 
    },
    courses: [
        {
            name: { type: String, required: true },
            code: { type: String, required: true },
            branch: { type: String, required: true }
        }
    ]
})


const studentDetails = mongoose.model("studentDetails", studentSchema);
const teacherDetails = mongoose.model("teacherDetails", studentSchema);
