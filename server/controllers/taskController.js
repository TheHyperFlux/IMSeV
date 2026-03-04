const mongoose = require('mongoose');
const Task = require('../models/Task');
const Group = require('../models/Group');

const toObjectId = (id) => {
    if (!id) return undefined;
    if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
    return undefined;
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'intern') {
            // Interns see tasks assigned to them OR to a group they belong to.
            // Match both string and ObjectId (legacy tasks may have string refs).
            const userIdStr = req.user.id || (req.user._id && req.user._id.toString());
            const userObjectId = toObjectId(userIdStr);
            const orConditions = [];
            // Tasks assigned to this user (as string or ObjectId)
            if (userIdStr) orConditions.push({ assigneeId: userIdStr });
            if (userObjectId) orConditions.push({ assigneeId: userObjectId });
            // Groups this user belongs to (memberIds can be string or ObjectId)
            const userGroups = await Group.find({
                $or: [
                    { memberIds: userIdStr },
                    ...(userObjectId ? [{ memberIds: userObjectId }] : [])
                ]
            }).select('_id');
            const groupIds = userGroups.map(g => g._id);
            const groupIdsStr = groupIds.map(g => g.toString());
            if (groupIds.length) {
                orConditions.push({ groupId: { $in: groupIds } });
                orConditions.push({ groupId: { $in: groupIdsStr } });
            }
            query = Task.find(orConditions.length ? { $or: orConditions } : { _id: null });
        } else {
            // Admins/Mentors see all (can be filtered by query params later)
            query = Task.find();
        }

        const tasks = await query;

        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin/Mentor)
exports.createTask = async (req, res) => {
    try {
        req.body.createdBy = req.user.id;

        // Business validation: only title, description and assignee/group are mandatory
        const { title, description, assigneeId, groupId } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Task title is required'
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Task description is required'
            });
        }

        if (!assigneeId && !groupId) {
            return res.status(400).json({
                success: false,
                error: 'Please assign the task to an individual or a group'
            });
        }

        // Convert refs to ObjectId so intern queries (assigneeId / groupId) match.
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'todo',
            priority: req.body.priority || 'medium',
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            createdBy: toObjectId(req.user.id),
            assigneeId: toObjectId(req.body.assigneeId),
            groupId: toObjectId(req.body.groupId),
        };
        const insertResult = await Task.collection.insertOne(taskData);
        const task = await Task.findById(insertResult.insertedId);

        res.status(201).json({ success: true, data: task });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update task (status, etc)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Interns can only update status of tasks assigned to them or their group
        if (req.user.role === 'intern') {
            const isAssignee = task.assigneeId && task.assigneeId.toString() === req.user.id;
            let isInTaskGroup = false;
            if (task.groupId) {
                const group = await Group.findById(task.groupId);
                isInTaskGroup = group && group.memberIds.some(m => m.toString() === req.user.id);
            }
            if (!isAssignee && !isInTaskGroup) {
                return res.status(401).json({ success: false, error: 'Not authorized to update this task' });
            }
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: false
            }
        );

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Internship not found' });
        }

        await task.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
