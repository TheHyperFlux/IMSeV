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
    try {
        // debug log
        console.log('acceptApplication called:', {
            params: req.params,
            body: req.body,
            user: { id: req.user.id, role: req.user.role }
        });

        // validate the incoming application id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid application ID' });
        }

        const app = await Application.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // if groupId was provided, validate it now; reject bad values early
        let groupId = req.body.groupId;
        if (groupId !== undefined && groupId !== null && groupId !== '') {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return res.status(400).json({ success: false, error: 'Invalid group ID' });
            }
        } else {
            groupId = undefined;
        }

        // Update application fields
        app.status = 'accepted';
        if (req.body.notes !== undefined) app.notes = req.body.notes;
        app.reviewedBy = req.user.id;
        app.reviewedAt = new Date();
        if (groupId) app.assignedGroupId = groupId;
        await app.save();

        // Promote user to intern
        let applicantId = app.userId;
        if (applicantId && typeof applicantId === 'object' && applicantId.toString) {
            applicantId = applicantId.toString();
        }

        const user = await User.findById(applicantId);
        if (user) {
            user.role = 'intern';
            if (groupId) user.assignedGroupId = groupId;
            await user.save();
        }

        // Add to group members if needed
        if (groupId) {
            const group = await Group.findById(groupId);
            if (group) {
                const existing = (group.memberIds || []).map(m => m.toString());
                if (!existing.includes(applicantId.toString())) {
                    group.memberIds = [...existing, applicantId];
                    await group.save();
                }
            }
        }

        // Increment internship filledSlots if possible
        if (app.internshipId) {
            let internshipId = app.internshipId;
            if (typeof internshipId === 'object' && internshipId.toString) {
                internshipId = internshipId.toString();
            }
            if (mongoose.Types.ObjectId.isValid(internshipId)) {
                const internship = await Internship.findById(internshipId);
                if (internship && typeof internship.filledSlots === 'number') {
                    internship.filledSlots = (internship.filledSlots || 0) + 1;
                    await internship.save();
                }
            }
        }

        const populated = await Application.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('internshipId', 'title');
        res.status(200).json({ success: true, data: populated });
    } catch (err) {
        console.error('Error in acceptApplication:', err);
        const msg = process.env.NODE_ENV === 'production' ? err.message : err.stack;
        res.status(500).json({ success: false, error: msg });
    }
};
