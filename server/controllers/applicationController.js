const Application = require('../models/Application');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Internship = require('../models/Internship');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private (Admin/Mentor) - Interns see their own
exports.getApplications = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'intern' || req.user.role === 'applicant') {
            query = Application.find({ userId: req.user.id });
        } else {
            query = Application.find();
        }

        const applications = await query.populate('userId', 'name email').populate('internshipId', 'title');

        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('internshipId', 'title');

        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Make sure user is application owner or admin/mentor
        if (application.userId.toString() !== req.user.id && req.user.role === 'applicant') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: application });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
exports.createApplication = async (req, res) => {
    try {
        req.body.userId = req.user.id;

        // Check if already applied
        const existingApp = await Application.findOne({
            userId: req.user.id,
            internshipId: req.body.internshipId
        });

        if (existingApp) {
            return res.status(400).json({ success: false, error: 'Already applied to this internship' });
        }

        const application = await Application.create(req.body);

        res.status(201).json({ success: true, data: application });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
exports.updateApplication = async (req, res) => {
    try {
        let application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Authorization check could be added here depending on requirements

        application = await Application.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: application });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Accept application (perform onboarding side-effects)
// @route   POST /api/applications/:id/accept
// @access  Private (Admin/Mentor)
exports.acceptApplication = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const app = await Application.findById(req.params.id).session(session);
        if (!app) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Update application fields
        app.status = 'accepted';
        if (req.body.notes) app.notes = req.body.notes;
        app.reviewedBy = req.user.id;
        app.reviewedAt = new Date();
        if (req.body.groupId) app.assignedGroupId = req.body.groupId;
        await app.save({ session });

        // Promote user to intern
        const applicantId = app.userId;
        const user = await User.findById(applicantId).session(session);
        if (user) {
            user.role = 'intern';
            if (req.body.groupId) user.assignedGroupId = req.body.groupId;
            await user.save({ session });
        }

        // Add to group members if needed
        if (req.body.groupId) {
            const group = await Group.findById(req.body.groupId).session(session);
            if (group) {
                const existing = (group.memberIds || []).map(m => m.toString());
                if (!existing.includes(applicantId.toString())) {
                    group.memberIds = [...existing, applicantId];
                    await group.save({ session });
                }
            }
        }

        // Increment internship filledSlots if possible
        if (app.internshipId) {
            const internship = await Internship.findById(app.internshipId).session(session);
            if (internship && typeof internship.filledSlots === 'number') {
                internship.filledSlots = (internship.filledSlots || 0) + 1;
                await internship.save({ session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        const populated = await Application.findById(req.params.id).populate('userId', 'name email').populate('internshipId', 'title');
        res.status(200).json({ success: true, data: populated });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error in acceptApplication:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
