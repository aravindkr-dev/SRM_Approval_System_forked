import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { UserRole } from '../../../../lib/types';

export async function POST() {
  try {
    await connectDB();
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'manager@test.com' });
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test manager user already exists',
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    }
    
    // Create a test Institution Manager user
    const testUser = await User.create({
      name: 'Test Manager',
      empId: 'MGR001',
      email: 'manager@test.com',
      password: 'password123',
      role: UserRole.INSTITUTION_MANAGER,
      college: 'Test College',
      department: 'Management',
    });

    const { password: _, ...userWithoutPassword } = testUser.toObject();
    
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Test manager user created successfully'
    });
  } catch (error: any) {
    console.error('Create test user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create test user' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      total: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        empId: user.empId,
        role: user.role,
        college: user.college,
        department: user.department
      }))
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get users' }, { status: 500 });
  }
}