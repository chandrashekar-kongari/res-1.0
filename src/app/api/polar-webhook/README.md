# Polar Webhook Integration

This directory contains the webhook integration for handling Polar subscription events.

## Setup

### 1. Environment Variables

Add the following environment variable to your `.env.local` file:

```env
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
```

You can get this secret from your Polar dashboard when setting up the webhook endpoint.

### 2. Webhook Endpoint Configuration

In your Polar dashboard, configure the webhook endpoint to:

- **URL**: `https://yourdomain.com/api/polar-webhook`
- **Events**: Select all subscription and order related events:
  - subscription.created
  - subscription.updated
  - subscription.active
  - subscription.canceled
  - subscription.uncanceled
  - subscription.revoked
  - order.created
  - order.paid
  - order.refunded
  - customer.created
  - customer.updated

### 3. Database Migration

After updating the schema, run the migration:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

## File Structure

- `route.ts` - Main webhook endpoint that validates and routes events
- `handlers.ts` - Individual event handlers for each webhook event type
- `utils.ts` - Helper functions for database operations
- `README.md` - This documentation

## Event Handling

The webhook system handles the following events:

### Subscription Events

- **subscription.created** - Creates new subscription record and updates user status
- **subscription.updated** - Updates existing subscription details
- **subscription.active** - Marks subscription as active
- **subscription.canceled** - Marks subscription as canceled
- **subscription.uncanceled** - Reactivates a canceled subscription
- **subscription.revoked** - Marks subscription as revoked

### Order Events

- **order.created** - Creates order record, handles renewals
- **order.paid** - Updates order status to paid
- **order.refunded** - Updates order status to refunded

### Customer Events

- **customer.created** - Links Polar customer to existing user
- **customer.updated** - Updates user information

## Database Schema

The integration adds three new models:

### subscription

Stores subscription data from Polar including status, pricing, and billing periods.

### order

Stores order data including payments and renewals.

### webhook_event

Tracks all webhook events for debugging and audit purposes.

## Error Handling

- Invalid signatures return 403 status
- Processing errors are logged and stored in webhook_event table
- Failed events can be retried by reprocessing webhook_event records
- Returns 202 status to prevent Polar from retrying immediately

## Testing

You can test the webhook locally using ngrok:

1. Start your development server
2. Run `ngrok http 3000`
3. Use the ngrok URL in your Polar webhook configuration
4. Test with actual subscription operations in Polar

## Monitoring

Check the `webhook_event` table to monitor:

- Event processing status
- Error messages
- Retry counts
- Processing timestamps
