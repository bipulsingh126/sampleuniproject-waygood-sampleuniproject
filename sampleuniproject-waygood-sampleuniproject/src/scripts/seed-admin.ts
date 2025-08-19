import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

async function seedAdmin() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

   
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

  
    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminUser = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
