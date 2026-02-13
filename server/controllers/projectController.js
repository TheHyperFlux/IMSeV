const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        let query;

        // If intern, only show assigned projects
        if (req.user.role === 'intern') {
            query = Project.find({ internIds: req.user.id });
        } else if (req.user.role === 'mentor') {
            query = Project.find({ mentorId: req.user.id });
        } else {
            query = Project.find();
        }

        const projects = await query
            .populate('mentorId', 'name')
            .populate('internIds', 'name');

        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('mentorId', 'name')
            .populate('internIds', 'name');

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/Mentor)
exports.createProject = async (req, res) => {
    try {
        // Determine mentorId
        if (req.user.role === 'mentor') {
            req.body.mentorId = req.user.id;
        }

        const project = await Project.create(req.body);

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Mentor)
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
