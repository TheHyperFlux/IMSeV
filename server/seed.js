const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Internship = require('./models/Internship');
const Application = require('./models/Application');
const Project = require('./models/Project');
const Task = require('./models/Task');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // Clear existing data
        await User.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});

        console.log('Cleared existing data');

        // Create Demo Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = [
            {
                name: 'Admin User',
                email: 'admin@numa.com',
                password: hashedPassword,
                role: 'admin',
                department: 'Management',
                bio: 'System Administrator',
                skills: ['Management', 'Leadership'],
                phone: '123-456-7890',
                joinedAt: new Date(),
                isActive: true,
            },
            {
                name: 'Mentor User',
                email: 'mentor@numa.com',
                password: hashedPassword,
                role: 'mentor',
                department: 'Engineering',
                bio: 'Senior Software Engineer',
                skills: ['React', 'Node.js', 'System Design'],
                phone: '987-654-3210',
                joinedAt: new Date(),
                isActive: true,
            },
            {
                name: 'Intern User',
                email: 'intern@numa.com',
                password: hashedPassword,
                role: 'intern',
                department: 'Engineering',
                bio: 'Aspiring Full Stack Developer',
                skills: ['JavaScript', 'HTML', 'CSS'],
                phone: '555-555-5555',
                joinedAt: new Date(),
                isActive: true,
            },
            {
                name: 'Applicant User',
                email: 'applicant@numa.com',
                password: hashedPassword,
                role: 'applicant',
                department: 'N/A',
                bio: 'Student looking for internship',
                skills: ['Python', 'Java'],
                phone: '111-222-3333',
                joinedAt: new Date(),
                isActive: true,
            },
        ];

        const createdUsers = await User.insertMany(users);
        console.log('Created Users');

        const admin = createdUsers.find(u => u.role === 'admin');
        const mentor = createdUsers.find(u => u.role === 'mentor');
        const intern = createdUsers.find(u => u.role === 'intern');

        // Create Internships
        const internships = [
            {
                title: 'Frontend Developer Intern',
                description: 'Work on our core product using React and TypeScript.',
                department: 'Engineering',
                location: 'Remote',
                duration: '3 months',
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
                requirements: ['React', 'TypeScript', 'Tailwind CSS'],
                responsibilities: ['Build UI components', 'Fix bugs'],
                stipend: '$1000/month',
                slots: 2,
                status: 'open',
                createdBy: admin._id,
            },
            {
                title: 'UX Design Intern',
                description: 'Help design the next generation of our user interface.',
                department: 'Design',
                location: 'New York, NY',
                duration: '6 months',
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                requirements: ['Figma', 'Adobe XD', 'User Research'],
                responsibilities: ['Create wireframes', 'Conduct user testing'],
                stipend: '$1200/month',
                slots: 1,
                status: 'open',
                createdBy: admin._id,
            },
        ];

        const createdInternships = await Internship.insertMany(internships);
        console.log('Created Internships');

        // Create Projects
        const projects = [
            {
                name: 'IMS Dashboard Redesign',
                description: 'Revamping the dashboard for better usability.',
                department: 'Engineering',
                status: 'active',
                startDate: new Date(),
                mentorId: mentor._id,
                internIds: [intern._id],
                createdBy: admin._id,
            }
        ];

        const createdProjects = await Project.insertMany(projects);
        console.log('Created Projects');

        // Create Tasks
        const tasks = [
            {
                title: 'Setup React Project',
                description: 'Initialize the project with Vite and Tailwind.',
                projectId: createdProjects[0]._id,
                status: 'completed',
                priority: 'high',
                assigneeId: intern._id,
                createdBy: mentor._id,
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Implement Authentication',
                description: 'Create login and register pages.',
                projectId: createdProjects[0]._id,
                status: 'in_progress',
                priority: 'high',
                assigneeId: intern._id,
                createdBy: mentor._id,
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            }
        ];

        await Task.insertMany(tasks);
        console.log('Created Tasks');

        console.log('Database Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
