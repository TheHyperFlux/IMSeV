const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testUserCreation = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        console.log('Database:', mongoose.connection.name);

        // Try to create a test user
        console.log('\nCreating test user...');
        const testUser = await User.create({
            name: 'Test User Direct',
            email: `test${Date.now()}@test.com`,
            password: 'test123',
            role: 'applicant'
        });

        console.log('User created:', testUser._id);

        // Verify it was saved
        const found = await User.findById(testUser._id);
        console.log('User found in DB:', found ? 'YES' : 'NO');

        if (found) {
            console.log('User details:', { name: found.name, email: found.email });
        }

        // Count total users
        const count = await User.countDocuments();
        console.log('Total users in database:', count);

        await mongoose.connection.close();
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testUserCreation();
