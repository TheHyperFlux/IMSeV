const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'mentor', 'intern', 'applicant'],
        default: 'applicant'
    },
    department: String,
    skills: [String],
    bio: String,
    phone: String,
    education: [{
        institution: String,
        degree: {
            type: String,
            enum: ['SEE', 'Higher Secondary', 'Bachelor'],
            default: 'SEE'
        },
        field: String,
        gpa: String,
        yearPassed: String,
        semester: String,
        year: String,
        current: {
            type: Boolean,
            default: false
        }
    }],
    experience: [{
        company: String,
        position: String,
        description: String,
        startDate: String,
        endDate: String,
        current: {
            type: Boolean,
            default: false
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
