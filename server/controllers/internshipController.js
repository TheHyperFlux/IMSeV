const Internship = require('../models/Internship');

// @desc    Get all internships
// @route   GET /api/internships
// @access  Public
exports.getInternships = async (req, res) => {
    try {
        const internships = await Internship.find();
        res.status(200).json({ success: true, count: internships.length, data: internships });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single internship
// @route   GET /api/internships/:id
// @access  Public
exports.getInternship = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ success: false, error: 'Internship not found' });
        }

        res.status(200).json({ success: true, data: internship });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new internship
// @route   POST /api/internships
// @access  Private (Admin/Mentor)
exports.createInternship = async (req, res) => {
    try {
        console.log('CREATE INTERNSHIP called');
        console.log('Request body:', req.body);
        console.log('User:', req.user?.email);

        // Add user to req.body
        req.body.createdBy = req.user.id;

        console.log('Creating internship in DB...');
        const internship = await Internship.create(req.body);
        console.log('Internship created! ID:', internship._id);

        res.status(201).json({ success: true, data: internship });
    } catch (err) {
        console.error('ERROR creating internship:', err.message);
        console.error('Full error:', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private (Admin/Mentor)
exports.updateInternship = async (req, res) => {
    try {
        let internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ success: false, error: 'Internship not found' });
        }

        // Make sure user is internship owner or admin
        // if (internship.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        //   return res.status(401).json({ success: false, error: 'Not authorized to update this internship' });
        // }

        internship = await Internship.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: internship });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private (Admin/Mentor)
exports.deleteInternship = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ success: false, error: 'Internship not found' });
        }

        // Make sure user is internship owner or admin
        // if (internship.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        //   return res.status(401).json({ success: false, error: 'Not authorized to delete this internship' });
        // }

        await internship.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
