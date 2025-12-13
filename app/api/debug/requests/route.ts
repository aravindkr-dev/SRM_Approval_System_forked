import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Request from '../../../../models/Request';

export async function GET() {
  try {
    await connectDB();
    
    const allRequests = await Request.find({})
      .populate('requester', 'name email role')
      .sort({ createdAt: -1 });

    const requestSummary = allRequests.map(req => ({
      id: req._id,
      title: req.title,
      status: req.status,
      requester: req.requester?.name || 'Unknown',
      requesterRole: req.requester?.role || 'Unknown',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }));

    return NextResponse.json({
      total: allRequests.length,
      requests: requestSummary,
      statusCounts: allRequests.reduce((acc: any, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Debug requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}