// Square API Types

export interface SquareAddress {
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  locality?: string;
  sublocality?: string;
  sublocality_2?: string;
  sublocality_3?: string;
  administrative_district_level_1?: string;
  administrative_district_level_2?: string;
  administrative_district_level_3?: string;
  postal_code?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
}

export interface SquareCustomerPreferences {
  email_unsubscribed?: boolean;
}

export interface SquareCustomerTaxIds {
  eu_vat?: string;
}

export interface SquareCustomer {
  // Read-only fields (assigned by Square)
  id?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
  
  // Customer identity
  given_name?: string;
  family_name?: string;
  nickname?: string;
  company_name?: string;
  
  // Contact information
  email_address?: string;
  phone_number?: string;
  address?: SquareAddress;
  
  // Additional information
  birthday?: string; // Format: YYYY-MM-DD
  reference_id?: string;
  note?: string;
  
  // Preferences and categorization
  preferences?: SquareCustomerPreferences;
  group_ids?: string[];
  segment_ids?: string[];
  
  // Metadata
  creation_source?: 'OTHER' | 'APPOINTMENTS' | 'COUPON' | 'DELETION_RECOVERY' | 'DIRECTORY' | 'EGIFTING' | 'EMAIL_COLLECTION' | 'FEEDBACK' | 'IMPORT' | 'INVOICES' | 'LOYALTY' | 'MARKETING' | 'MERGE' | 'ONLINE_STORE' | 'INSTANT_PROFILE' | 'TERMINAL' | 'THIRD_PARTY' | 'THIRD_PARTY_IMPORT' | 'UNMERGE_RECOVERY';
  tax_ids?: SquareCustomerTaxIds;
}

export interface CreateSquareCustomerRequest {
  idempotency_key?: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  nickname?: string;
  email_address?: string;
  address?: SquareAddress;
  phone_number?: string;
  reference_id?: string;
  note?: string;
  birthday?: string;
  tax_ids?: SquareCustomerTaxIds;
}

export interface UpdateSquareCustomerRequest {
  given_name?: string;
  family_name?: string;
  company_name?: string;
  nickname?: string;
  email_address?: string;
  address?: SquareAddress;
  phone_number?: string;
  reference_id?: string;
  note?: string;
  birthday?: string;
  tax_ids?: SquareCustomerTaxIds;
  version?: number;
}

export interface SquareCustomerResponse {
  customer?: SquareCustomer;
  errors?: SquareError[];
}

export interface SquareError {
  category: string;
  code: string;
  detail?: string;
  field?: string;
}

// Card on File types
export interface SquareCard {
  id?: string;
  card_brand?: 'VISA' | 'MASTERCARD' | 'AMERICAN_EXPRESS' | 'DISCOVER' | 'DISCOVER_DINERS' | 'JCB' | 'CHINA_UNIONPAY' | 'SQUARE_GIFT_CARD' | 'SQUARE_CAPITAL_CARD' | 'INTERAC' | 'EFTPOS' | 'FELICA' | 'EBT' | 'OTHER_BRAND';
  last_4?: string;
  exp_month?: number;
  exp_year?: number;
  cardholder_name?: string;
  billing_address?: SquareAddress;
  fingerprint?: string;
  customer_id?: string;
  merchant_id?: string;
  reference_id?: string;
  enabled?: boolean;
  card_type?: 'CREDIT' | 'DEBIT' | 'UNKNOWN';
  prepaid_type?: 'PREPAID' | 'NOT_PREPAID' | 'UNKNOWN';
  bin?: string;
  version?: number;
  created_at?: string;
}

export interface CreateSquareCardRequest {
  idempotency_key: string;
  source_id: string; // Payment token/nonce from Web Payments SDK
  card?: {
    billing_address?: SquareAddress;
    cardholder_name?: string;
    customer_id?: string;
    reference_id?: string;
  };
  verification_token?: string;
}

export interface SquareCardResponse {
  card?: SquareCard;
  errors?: SquareError[];
}