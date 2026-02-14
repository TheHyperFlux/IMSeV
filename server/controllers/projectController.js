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

        const projects = await query;

        // Normalize response shape for frontend (use `name` derived from `title`)
        const formattedProjects = projects.map(project => {
            const obj = project.toObject();
            if (!obj.name && obj.title) {
                obj.name = obj.title;
            }
            return obj;
        });

        res.status(200).json({
            success: true,
            count: formattedProjects.length,
            data: formattedProjects
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const obj = project.toObject();
        if (!obj.name && obj.title) {
            obj.name = obj.title;
        }

        res.status(200).json({ success: true, data: obj });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/Mentor)
exports.createProject = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.title || !req.body.title.trim()) {
            return res.status(400).json({ success: false, error: 'Project title is required' });
        }

        if (!req.body.mentorId) {
            return res.status(400).json({ success: false, error: 'Mentor ID is required' });
        }

        // Trim string fields
        req.body.title = req.body.title.trim();
        req.body.description = (req.body.description || '').trim();
        req.body.department = (req.body.department || '').trim();

        // Determine mentorId if not provided (for mentors creating projects)
        if (req.user.role === 'mentor' && !req.body.mentorId) {
            req.body.mentorId = req.user.id;
        }

        // Validate internIds if provided
        if (req.body.internIds && Array.isArray(req.body.internIds)) {
            req.body.internIds = req.body.internIds.filter(id => id && typeof id === 'string');
        }

        const project = await Project.create(req.body);

        const obj = project.toObject();
        if (!obj.name && obj.title) {
            obj.name = obj.title;
        }

        res.status(201).json({ success: true, data: obj });
    } catch (err) {
        console.error('Error creating project:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                success: false, 
                error: messages.join(', ') 
            });
        }
        
        res.status(400).json({ success: false, error: err.message || 'Failed to create project' });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Mentor)
exports.updateProject = async (req, res) => {
    try {
        // Support `name` from frontend by mapping it to `title`
        if (req.body.name && !req.body.title) {
            req.body.title = req.body.name;
            delete req.body.name;
        }

        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        const obj = project.toObject();
        if (!obj.name && obj.title) {
            obj.name = obj.title;
        }

        res.status(200).json({ success: true, data: obj });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Mentor)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        await project.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
