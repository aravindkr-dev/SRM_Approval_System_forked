import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Request from '../../../../models/Request';
import User from '../../../../models/User';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    
    // Get current user
    const currentUser = await getCurrentUser();
    
    // Get all users
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    // Get all requests
    const requests = await Request.find({}).sort({ createdAt: -1 });
    
    // Count by role
    const usersByRole = users.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Count by status
    const requestsByStatus = requests.reduce((acc: any, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: currentUser.name
      } : null,
      users: {
        total: users.length,
        byRole: usersByRole,
        list: users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          empId: u.empId
        }))
      },
      requests: {
        total: requests.length,
        byStatus: requestsByStatus,
        list: requests.map(r => ({
          id: r._id,
          title: r.title,
          status: r.status,
          requester: r.requester,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Debug status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get status' }, { status: 500 });
  }
}