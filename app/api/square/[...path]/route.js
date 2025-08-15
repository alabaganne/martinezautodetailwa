import { NextResponse } from 'next/server';

let squareClient = null;

async function getSquareClient() {
  if (!squareClient) {
    const { SquareClient, SquareEnvironment } = await import('square');
    squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox
    });
  }
  return squareClient;
}

export async function GET(request, { params }) {
  try {
    const client = await getSquareClient();
    const { path } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Handle different endpoints
    if (path[0] === 'locations') {
      if (path.length === 1) {
        // List locations
        const response = await client.locations.list();
        return NextResponse.json(response.result);
      } else {
        // Get specific location
        const response = await client.locations.retrieve(path[1]);
        return NextResponse.json(response.result);
      }
    }
    
    if (path[0] === 'customers' && path.length === 2) {
      // Get specific customer
      const response = await client.customers.retrieve(path[1]);
      return NextResponse.json(response.result);
    }
    
    if (path[0] === 'catalog' && path[1] === 'list') {
      // List catalog
      const types = searchParams.get('types');
      const cursor = searchParams.get('cursor');
      const response = await client.catalog.list(cursor, types);
      return NextResponse.json(response.result);
    }
    
    if (path[0] === 'bookings' && path[1] === 'booking-profiles') {
      // List booking profiles
      const limit = searchParams.get('limit');
      const cursor = searchParams.get('cursor');
      const locationId = searchParams.get('location_id');
      const response = await client.bookings.listBookingProfiles(
        limit ? parseInt(limit) : undefined,
        cursor,
        locationId
      );
      return NextResponse.json(response.result);
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Square API Error:', error);
    
    if (error.result?.errors) {
      return NextResponse.json(
        { errors: error.result.errors },
        { status: error.statusCode || 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const client = await getSquareClient();
    const { path } = await params;
    const body = await request.json();
    
    // Handle different endpoints
    if (path[0] === 'customers') {
      // Create customer
      const response = await client.customers.create(body);
      return NextResponse.json(response.result);
    }
    
    if (path[0] === 'team-members' && path[1] === 'search') {
      // Search team members
      const response = await client.team.searchTeamMembers(body);
      return NextResponse.json(response.result);
    }
    
    if (path[0] === 'payments') {
      // Create payment
      const response = await client.payments.create(body);
      return NextResponse.json(response.result);
    }
    
    if (path[0] === 'bookings') {
      // Create booking
      const response = await client.bookings.create(body);
      return NextResponse.json(response.result);
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Square API Error:', error);
    
    if (error.result?.errors) {
      return NextResponse.json(
        { errors: error.result.errors },
        { status: error.statusCode || 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}