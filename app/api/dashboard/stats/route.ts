import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Request from '../../../../models/Request';
import User from '../../../../models/User';
import { getCurrentUser } from '../../../../lib/auth';
import { RequestStatus, UserRole } from '../../../../lib/types';
import { filterRequestsByVisibility } from '../../../../lib/request-visibility';
import mongoose from 'mongoose';



export async function GET() {
  try {
    await connectDB();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's database record
    let dbUser = null;
    if (mongoose.Types.ObjectId.isValid(user.id)) {
      dbUser = await User.findById(user.id);
    } else {
      dbUser = await User.findOne({ email: user.email });
    }
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all requests and apply sophisticated visibility filtering
    const allRequests = await Request.find({})
      .populate('requester', 'name email empId')
      .populate('history.actor', 'name email empId')
      .lean(); // Convert to plain objects
    
    // Apply role-based visibility filtering
    const visibleRequests = filterRequestsByVisibility(
      allRequests, 
      user.role as UserRole, 
      dbUser._id.toString()
    );

    // Calculate stats based on user's involvement categories
    const totalRequests = visibleRequests.length;
    
    const pendingRequests = visibleRequests.filter(req => 
      req._visibility.category === 'pending'
    ).length;
    
    // Approved requests = only requests that have been fully approved by Chairman
    const approvedRequests = visibleRequests.filter(req => 
      req.status === RequestStatus.APPROVED
    ).length;
    
    const rejectedRequests = visibleRequests.filter(req => 
      req.status === RequestStatus.REJECTED
    ).length;

    // Calculate in-progress requests for non-requesters
    const inProgressRequests = user.role === UserRole.REQUESTER ? 0 : visibleRequests.filter(req => 
      req._visibility.category === 'in_progress' && 
      (req._visibility.userAction === 'approve' || req._visibility.userAction === 'clarify')
    ).length;

    return NextResponse.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      inProgressRequests,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}