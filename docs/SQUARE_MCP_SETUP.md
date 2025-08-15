# Square MCP Server Integration Guide

This guide explains how to integrate the Square MCP (Model Context Protocol) server with Claude Code for the car wash appointment booking system.

## What is MCP?

MCP (Model Context Protocol) is a standardized protocol that allows Claude Code to connect with external tools and data sources. The Square MCP server provides direct access to Square's APIs through Claude Code, enabling real-time payment processing, customer management, and business operations.

## Prerequisites

1. **Square Account**: You need a Square developer account
2. **Square API Credentials**: 
   - Access Token
   - Application ID
   - Location ID
3. **Claude Code**: Latest version with MCP support

## Setup Steps

### 1. Obtain Square Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or select existing one
3. Navigate to the "OAuth" or "Credentials" section
4. Copy your:
   - **Access Token**: For API authentication
   - **Application ID**: Your app's unique identifier
   - **Location ID**: Your business location identifier

### 2. Configure Environment Variables

Add your Square credentials to the `.env` file:

```env
# Square MCP Server Configuration
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_ENVIRONMENT=sandbox  # or 'production' for live
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_APPLICATION_ID=your_application_id_here
```

### 3. MCP Configuration

The `.mcp.json` file has been configured with:

- **Server Type**: SSE (Server-Sent Events) for real-time communication
- **Endpoint**: https://mcp.squareup.com/sse
- **Authentication**: OAuth2 with comprehensive scopes
- **Capabilities**: Full access to Square's business tools

### 4. Connect to Square MCP Server

In Claude Code:

1. Open your project
2. The MCP server should auto-detect the `.mcp.json` configuration
3. You may be prompted to authenticate with Square
4. Once connected, Claude Code will have access to Square tools

## Available Square Tools

Once connected, Claude Code can:

- **Payments**: Process payments, refunds, and view transaction history
- **Customers**: Create and manage customer profiles
- **Catalog**: Manage products and services
- **Inventory**: Track stock levels
- **Orders**: Create and manage orders
- **Invoices**: Generate and send invoices
- **Bookings**: Manage appointments (perfect for car wash bookings!)
- **Team**: Manage employees and roles
- **Analytics**: Access business insights and reports

## Using Square Tools in Claude Code

Once connected, you can ask Claude Code to:

```
"Create a Square customer profile for John Doe"
"Check today's payment transactions"
"Create a booking for tomorrow at 9 AM"
"Generate an invoice for the last appointment"
```

## Security Best Practices

1. **Never commit credentials**: The `.env` file is gitignored
2. **Use sandbox for testing**: Always test with sandbox credentials first
3. **Limit scopes**: Only request necessary OAuth scopes
4. **Rotate tokens regularly**: Update access tokens periodically
5. **Monitor usage**: Check Square dashboard for API usage

## Troubleshooting

### Connection Issues

If the MCP server doesn't connect:

1. Verify credentials in `.env` file
2. Check internet connection
3. Ensure Square account is active
4. Try refreshing Claude Code

### Authentication Errors

- Verify access token is valid
- Check if token has required scopes
- Ensure environment matches (sandbox vs production)

### Rate Limiting

Square API has rate limits. If you hit limits:
- Wait a few minutes before retrying
- Check Square dashboard for usage stats
- Consider implementing request queuing

## Integration with Booking System

The Square MCP server integrates seamlessly with our booking system:

1. **Customer Creation**: Automatically create Square customer profiles
2. **Payment Processing**: Handle deposits or full payments
3. **Appointment Management**: Sync bookings with Square Appointments
4. **Invoicing**: Generate invoices for completed services
5. **Analytics**: Track business metrics and customer trends

## Next Steps

1. Test the connection with sandbox credentials
2. Implement payment processing in the booking flow
3. Set up customer profile creation
4. Configure appointment sync with Square
5. Add invoice generation for completed services

## Support

- [Square Developer Documentation](https://developer.squareup.com/docs)
- [MCP Documentation](https://docs.anthropic.com/claude-code/mcp)
- [Square API Reference](https://developer.squareup.com/reference/square)