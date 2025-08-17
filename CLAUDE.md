# Square API Integration Reference

## Square Account Information

### Production Account (MCP)
- **Location ID**: `LGWK1MZK9Z7HD`
- **Merchant ID**: `ML81XE3XYV4TR`
- **Business Name**: Car Wash
- **Currency**: TND (Tunisian Dinar)
- **Country**: TN (Tunisia)
- **Environment**: Production

### Sandbox Account (Development)
- **Location ID**: `LV4DAD1RNRA50`
- **Application ID**: `sandbox-sq0idb-sm1yUKdKioFhoaR0EO-ezg`
- **Environment**: Sandbox
- **Currency**: USD
- **Test Dashboard**: https://squareupsandbox.com/dashboard

## Square MCP Connection
The Square API is accessible through the MCP (Model Context Protocol) connection. Use the following tools:
- `mcp__square__get_service_info` - Get available methods for a service
- `mcp__square__get_type_info` - Get type information for API methods
- `mcp__square__make_api_request` - Make API calls to Square

## Catalog Structure

### Categories (3 total)
| Category Name | Category ID | 
|--------------|-------------|
| Small Car | ECC3W3WES4GBL6IH7LYOUR4L |
| Truck | EV6ZSMMZFW4BYXQQT4TLW7YS |
| Minivan | VM3MKKZQDRGVAXRB753RL6DG |

### Service Items (9 total)

#### Small Car Services
| Service | Item ID | Normal Price | Very Dirty Price | Duration |
|---------|---------|--------------|------------------|----------|
| Interior Only | 4RLOIGSU4XSH2MGMIOZSEKHQ | 120 TND | 170 TND | 3h 30m |
| Exterior Only | M4ILBX4XAORVF7CPHZ3VBZR7 | 100 TND | 150 TND | 3h |
| Full Detail | GK73LVPMKT3HSMR6YAFETGNK | 200 TND | 250 TND | 4h |

#### Truck Services
| Service | Item ID | Normal Price | Very Dirty Price | Duration |
|---------|---------|--------------|------------------|----------|
| Interior Only | 4RUCE3VOVWCRTHMZJXIEWJVO | 144 TND | 194 TND | 4h 30m |
| Exterior Only | HCWP4OUIAWFF533BDBHDG7BH | 120 TND | 170 TND | 3h 30m |
| Full Detail | LQOMKWIYDL65CJUZ6RTJK6TI | 240 TND | 290 TND | 5h |

#### Minivan Services
| Service | Item ID | Normal Price | Very Dirty Price | Duration |
|---------|---------|--------------|------------------|----------|
| Interior Only | T752W5ZIXDAOHUNJVHOZXLJZ | 156 TND | 206 TND | 5h |
| Exterior Only | HAGUC6GAZYT22BVGF7ITVGIW | 130 TND | 180 TND | 3h 30m |
| Full Detail | GJKDWM7EOOTGFEQBSOU4QGQI | 260 TND | 310 TND | 5h 30m |

### Item Variation IDs

#### Small Car Variations
- Interior Normal: R4QEQQKYH2ZTHK42N4PBWMBF (SKU: SC-INT-NORM)
- Interior Dirty: WR626M3TBZ2OT76MGJBJPOKI (SKU: SC-INT-DIRTY)
- Exterior Normal: OHWPHD2NSYU2W6P5UKRNBUXN (SKU: SC-EXT-NORM)
- Exterior Dirty: 22ONJEQ6B6HTS7H3WOTZX47M (SKU: SC-EXT-DIRTY)
- Full Normal: 7E5ZKY2MIB343XB5AK6PHKIP (SKU: SC-FULL-NORM)
- Full Dirty: 25ONP2VLLAPY3LQK2JI3J5N5 (SKU: SC-FULL-DIRTY)

#### Truck Variations
- Interior Normal: RCV4CRPK3AG56E4WFZ7KGROL (SKU: TR-INT-NORM)
- Interior Dirty: Z7DFI7JZGJS5CDDP42XNFXPZ (SKU: TR-INT-DIRTY)
- Exterior Normal: HZ32HENMKPN355FFFO6QLUX7 (SKU: TR-EXT-NORM)
- Exterior Dirty: XGMV365UPGWBAQYRLXO77IOS (SKU: TR-EXT-DIRTY)
- Full Normal: RFQR3FBHIP6TDYBYWU6GKNQM (SKU: TR-FULL-NORM)
- Full Dirty: 2ZDB37I3HBNL4CJVMAWVF63R (SKU: TR-FULL-DIRTY)

#### Minivan Variations
- Interior Normal: ECXZBRJ5SWWQM6I4Y57JSWV6 (SKU: MV-INT-NORM)
- Interior Dirty: TH65Q3A4R2I444N6NU45HSEU (SKU: MV-INT-DIRTY)
- Exterior Normal: MB77ISGXPXOOW7GUZDJLFTIN (SKU: MV-EXT-NORM)
- Exterior Dirty: 75QB7F7JYWLDMHYP3PMLXY4W (SKU: MV-EXT-DIRTY)
- Full Normal: SIM2MAXYMYJFEMT3NU53S4OV (SKU: MV-FULL-NORM)
- Full Dirty: BK6U5KHH36KQEV7RJY5YENCM (SKU: MV-FULL-DIRTY)

## Important Notes for Booking Implementation

### Currency Handling
- All amounts are in millimes (1 TND = 1000 millimes)
- When creating orders/payments, multiply TND amounts by 1000
- Example: 120 TND = 120000 millimes

### Booking Requirements
To create a booking through Square API, you'll need:
1. **Customer API** - Create or retrieve customer records
2. **Bookings API** - Create appointments (if Square Appointments is enabled)
3. **Orders API** - Create orders for the services
4. **Payments API** - Process payments

### API Services Available
- `customers` - Customer management
- `bookings` - Appointment scheduling
- `catalog` - Service items and pricing
- `orders` - Order creation and management
- `payments` - Payment processing
- `locations` - Location details
- `team` - Team member management (for assigning services)

### Example API Calls

#### Create a Customer with Card on File
```javascript
{
  "service": "customers",
  "method": "create",
  "request": {
    "given_name": "John",
    "family_name": "Doe",
    "email_address": "john@example.com",
    "phone_number": "+21612345678"
  }
}
```

#### Store Card on File for Customer
```javascript
{
  "service": "cards",
  "method": "create",
  "request": {
    "idempotency_key": "unique-key-here",
    "source_id": "cnon:card-nonce-from-web-payments-sdk",
    "card": {
      "cardholder_name": "John Doe",
      "customer_id": "CUSTOMER_ID_HERE"
    }
  }
}
```

#### Search Catalog Items
```javascript
{
  "service": "catalog",
  "method": "searchObjects",
  "request": {
    "object_types": ["ITEM"],
    "query": {
      "text_query": {
        "keywords": ["Interior", "Small Car"]
      }
    }
  }
}
```

#### Create an Order
```javascript
{
  "service": "orders",
  "method": "create",
  "request": {
    "order": {
      "location_id": "LGWK1MZK9Z7HD",
      "line_items": [
        {
          "catalog_object_id": "VARIATION_ID_HERE",
          "quantity": "1"
        }
      ]
    }
  }
}
```

## Development Environment

### Project Structure
- Next.js 15 application
- API routes at `/app/api/square/[...path]/route.js`
- MCP connection for Square API access
- Components in `/components/booking/`
- Utilities in `/lib/utils/`

### Environment Variables Setup

#### Getting Square Credentials
1. Go to Square Developer Dashboard: https://developer.squareup.com/apps
2. Select your application or create a new one
3. Navigate to "Credentials" or "OAuth" section
4. Copy the required credentials:
   - Access Token
   - Application ID
   - Application Secret (for OAuth flows)
5. Choose environment: Sandbox (testing) or Production (live)

#### Environment Variables Needed
```env
# For Sandbox/Development
SQUARE_ACCESS_TOKEN=your_sandbox_access_token
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=your_sandbox_location_id
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxx
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_sandbox_location_id

# For Production
SQUARE_ACCESS_TOKEN=your_production_access_token
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=LGWK1MZK9Z7HD
SQUARE_APPLICATION_ID=sq0idp-xxxxx
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production
NEXT_PUBLIC_SQUARE_LOCATION_ID=LGWK1MZK9Z7HD
```

**Important:** After updating `.env.local`, restart your Next.js development server to load the new environment variables.

### Testing Commands
```bash
# Test Square API connection
npm run test:square

# Start development server
npm run dev

# Build for production
npm run build
```

## Square Dashboard URLs
- **Production Dashboard**: https://squareup.com/dashboard
- **Catalog Items**: https://squareup.com/dashboard/items/library
- **Customers**: https://squareup.com/dashboard/customers
- **Orders**: https://squareup.com/dashboard/sales/transactions
- **Settings**: https://squareup.com/dashboard/account/general

## Payment Capture for No-Show Protection

### Strategy: Card on File with Authorization Hold
To protect against no-shows, implement a two-step payment process:

1. **At Booking Time**: 
   - Capture card details using Square Web Payments SDK
   - Store card on file for the customer
   - Optional: Place authorization hold for service amount

2. **After Service Completion**:
   - Charge the stored card for the service
   - Release any authorization holds

3. **For No-Shows**:
   - Charge a no-show fee using the stored card
   - Typical fee: 50% of service cost or flat fee (e.g., 50 TND)

### Implementation Steps

#### 1. Square Web Payments SDK Setup
```html
<!-- Add to your booking form page -->
<script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
<!-- For production: https://web.squarecdn.com/v1/square.js -->
```

#### 2. Initialize Payment Form
```javascript
const payments = Square.payments(appId, locationId);
const card = await payments.card();
await card.attach('#card-container');

// Get payment token (nonce)
const result = await card.tokenize();
const nonce = result.token;
```

#### 3. Create Customer with Card on File
```javascript
// Step 1: Create customer
const customer = await createCustomer({
  given_name: "John",
  family_name: "Doe",
  email_address: "john@example.com",
  phone_number: "+21612345678"
});

// Step 2: Store card for customer
const card = await storeCard({
  source_id: nonce, // From Web Payments SDK
  customer_id: customer.id,
  cardholder_name: "John Doe"
});

// Step 3: Save card.id for future charges
const cardId = card.id;
```

#### 4. Charge Card for No-Show
```javascript
{
  "service": "payments",
  "method": "create",
  "request": {
    "source_id": "STORED_CARD_ID",
    "idempotency_key": "unique-key-for-this-charge",
    "amount_money": {
      "amount": 50000, // 50 TND no-show fee in millimes
      "currency": "TND"
    },
    "customer_id": "CUSTOMER_ID",
    "reference_id": "BOOKING_ID",
    "note": "No-show fee for missed appointment on DATE"
  }
}
```

### No-Show Policy Configuration
```javascript
const noShowPolicy = {
  enabled: true,
  fee_type: "percentage", // or "flat"
  fee_percentage: 50, // 50% of service cost
  fee_flat_amount: 50000, // 50 TND in millimes
  grace_period_minutes: 15, // Wait 15 mins before marking as no-show
  auto_charge: false, // Require manual confirmation to charge
  notification_before_charge: true // Notify customer before charging
};
```

### Card Storage Security Notes
- **PCI Compliance**: Never store raw card numbers
- **Use Tokenization**: Always use Square's tokenization (nonces)
- **Card on File**: Square handles secure storage
- **Customer Consent**: Get explicit consent for card storage
- **Terms & Conditions**: Include no-show policy in booking terms

### Required API Services
- `cards` - Store and manage cards on file
- `payments` - Process charges and refunds
- `customers` - Link cards to customer profiles

## Future Implementation Checklist

### For Booking System with Payment Capture
- [ ] Enable Square Appointments in dashboard (if not enabled)
- [ ] Set up Square Web Payments SDK
- [ ] Create payment capture form UI
- [ ] Implement card tokenization flow
- [ ] Store card on file for customers
- [ ] Create booking with payment method attached
- [ ] Set up no-show detection logic
- [ ] Implement no-show fee charging
- [ ] Add email/SMS notifications for charges
- [ ] Create refund process for cancellations

### For Payment Processing
- [ ] Set up Square Web Payments SDK for card collection
- [ ] Implement payment form in frontend
- [ ] Create card storage endpoint in API routes
- [ ] Handle payment authorization/capture
- [ ] Store transaction records
- [ ] Implement refund functionality
- [ ] Add payment receipt generation

## Pricing Logic Reference
```javascript
// Base prices (in TND)
const basePrices = {
  interior: 120,
  exterior: 100,
  full: 200
};

// Vehicle multipliers
const multipliers = {
  small: 1.0,
  truck: 1.2,
  minivan: 1.3
};

// Condition extra charge
const veryDirtyExtra = 50; // TND

// Calculate final price
const finalPrice = (basePrice * multiplier) + (isVeryDirty ? veryDirtyExtra : 0);
```

## Contact & Support
- Square Developer Dashboard: https://developer.squareup.com
- API Reference: https://developer.squareup.com/reference/square
- Support: https://squareup.com/help

---
*Last Updated: 2025-08-16*
*This file contains essential information for maintaining and extending the Square API integration.*