#!/usr/bin/env node

/**
 * Daily cron job to charge 30% no-show fees for missed appointments.
 *
 * The script looks for bookings marked as NO_SHOW that are at least 24 hours old,
 * charges the saved card on file for 30% of the service price, and writes a
 * marker into the booking seller note so we do not bill the same booking twice.
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');
const { randomUUID, createHash } = require('crypto');

config({ path: '.env.local' });

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local. Aborting no-show cron run.');
  process.exit(1);
}

const environment = process.env.SQUARE_ENVIRONMENT === 'production'
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-no-show-cron'
});

const NO_SHOW_FEE_RATE = 0.3;
const GRACE_PERIOD_HOURS = parseInt(process.env.NO_SHOW_GRACE_PERIOD_HOURS || '24', 10);
const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000;
const LOOKBACK_DAYS = parseInt(process.env.NO_SHOW_LOOKBACK_DAYS || '30', 10);
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

const summary = {
  processed: 0,
  eligible: 0,
  charged: 0,
  skipped: [],
  errors: []
};

const variationPriceCache = new Map();

function logSkip(bookingId, reason) {
  const message = `${bookingId ? `Booking ${bookingId}` : 'Booking'} skipped: ${reason}`;
  summary.skipped.push(message);
  console.log(`⚪ ${message}`);
}

function logError(bookingId, error) {
  const errorMessage = error?.message || error?.errors?.map(e => e.detail).join(', ') || String(error);
  const message = `${bookingId ? `Booking ${bookingId}` : 'Booking'} failed: ${errorMessage}`;
  summary.errors.push(message);
  console.error(`✗ ${message}`);
}

async function getLocationId() {
  const response = await client.locations.list();
  const locations = response?.locations || response?.result?.locations || [];
  if (!locations.length) {
    throw new Error('No Square locations available.');
  }
  return locations[0].id;
}

function toBigInt(value) {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    return BigInt(Math.round(value));
  }
  if (typeof value === 'string') {
    return BigInt(value);
  }
  throw new Error(`Unable to convert value "${value}" to BigInt.`);
}

async function getVariationPriceMoney(variationId) {
  if (!variationId) {
    return null;
  }
  if (variationPriceCache.has(variationId)) {
    return variationPriceCache.get(variationId);
  }

  const response = await client.catalog.object.get({ objectId: variationId });
  const variation = response?.object || response?.result?.object || response?.data?.object;
  const priceMoney = variation?.itemVariationData?.priceMoney;

  if (!priceMoney || priceMoney.amount == null) {
    throw new Error(`No price found for service variation ${variationId}.`);
  }

  const normalized = {
    amount: toBigInt(priceMoney.amount),
    currency: priceMoney.currency || 'USD'
  };
  variationPriceCache.set(variationId, normalized);
  return normalized;
}

async function getBookingServicePriceMoney(booking) {
  const segments = Array.isArray(booking?.appointmentSegments) ? booking.appointmentSegments : [];
  if (!segments.length) {
    return null;
  }

  let totalAmount = 0n;
  let currency = null;

  for (const segment of segments) {
    const variationId = segment?.serviceVariationId;
    if (!variationId) {
      continue;
    }
    const priceMoney = await getVariationPriceMoney(variationId);
    totalAmount += priceMoney.amount;
    currency = currency || priceMoney.currency;
  }

  if (totalAmount <= 0n) {
    return null;
  }

  return {
    amount: totalAmount,
    currency: currency || 'USD'
  };
}

function calculateNoShowFee(serviceMoney) {
  if (!serviceMoney || serviceMoney.amount == null) {
    return null;
  }
  const amountNumber = Number(serviceMoney.amount);
  const feeCents = Math.round(amountNumber * NO_SHOW_FEE_RATE);
  if (feeCents <= 0) {
    return null;
  }
  return {
    amount: BigInt(feeCents),
    currency: serviceMoney.currency || 'USD'
  };
}

function formatMoney(money) {
  if (!money) {
    return '0.00';
  }
  const amountNumber = Number(money.amount) / 100;
  return `${amountNumber.toFixed(2)} ${money.currency}`;
}

function extractCardId(note) {
  const details = getSellerNoteDetails(note);
  if (details.cardId) {
    return details.cardId;
  }
  if (typeof note !== 'string') {
    return null;
  }
  const match = note.match(/Card ID:\s*([\w:-]+)/i);
  return match ? match[1] : null;
}

function getSellerNoteDetails(note) {
  const details = {
    cardId: null,
    chargedCents: null,
    chargedCurrency: null,
    chargedAt: null,
    paymentId: null,
    otherTokens: []
  };

  if (typeof note !== 'string' || note.trim() === '') {
    return details;
  }

  const tokens = note.split('|').map(token => token.trim()).filter(Boolean);
  for (const token of tokens) {
    const [rawKey, ...rawValue] = token.split(':');
    if (!rawKey || rawValue.length === 0) {
      details.otherTokens.push(token);
      continue;
    }

    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(':').trim();

    switch (key) {
      case 'card id':
        details.cardId = value || null;
        break;
      case 'no-show fee charged (cents)': {
        const numeric = value.replace(/[^0-9-]/g, '');
        if (numeric) {
          try {
            details.chargedCents = BigInt(numeric);
          } catch {
            details.chargedCents = null;
          }
        } else if (value === '0') {
          details.chargedCents = 0n;
        }
        break;
      }
      case 'no-show fee charged currency':
        details.chargedCurrency = value || null;
        break;
      case 'no-show fee charged at':
        details.chargedAt = value || null;
        break;
      case 'no-show fee charged payment id':
        details.paymentId = value || null;
        break;
      default:
        details.otherTokens.push(token);
        break;
    }
  }

  return details;
}

function composeChargedSellerNote({ originalNote, cardId, feeMoney, paymentId }) {
  const details = getSellerNoteDetails(originalNote);
  const tokens = details.otherTokens.filter(Boolean);

  const resolvedCardId = cardId || details.cardId;
  if (resolvedCardId) {
    tokens.unshift(`Card ID: ${resolvedCardId}`);
  }

  const amountCents = feeMoney?.amount != null ? feeMoney.amount.toString() : null;
  if (amountCents != null) {
    tokens.push(`No-Show Fee Charged (cents): ${amountCents}`);
  }

  if (feeMoney?.currency) {
    tokens.push(`No-Show Fee Charged Currency: ${feeMoney.currency}`);
  } else if (details.chargedCurrency) {
    tokens.push(`No-Show Fee Charged Currency: ${details.chargedCurrency}`);
  }

  const chargedAt = new Date().toISOString();
  tokens.push(`No-Show Fee Charged At: ${chargedAt}`);

  if (paymentId) {
    tokens.push(`No-Show Fee Charged Payment ID: ${paymentId}`);
  }

  return tokens.join(' | ');
}

function buildPaymentIdempotencyKey(bookingId, amount) {
  const base = `${bookingId || 'unknown'}-${amount != null ? amount.toString() : '0'}`;
  return createHash('sha256').update(base).digest('hex').slice(0, 45);
}

async function markBookingCharged({ booking, cardId, feeMoney, paymentId }) {
  const bookingId = booking?.id;
  if (!bookingId) {
    throw new Error('Cannot update booking without an ID.');
  }

  const sellerNote = composeChargedSellerNote({
    originalNote: booking.sellerNote,
    cardId,
    feeMoney,
    paymentId
  });

  const bookingPayload = {
    sellerNote
  };

  if (booking?.version != null) {
    bookingPayload.version = booking.version;
  }

  await client.bookings.update({
    bookingId,
    idempotencyKey: randomUUID(),
    booking: bookingPayload
  });
}

function hasGracePeriodElapsed(booking) {
  if (!booking?.startAt) {
    return false;
  }
  const startTime = new Date(booking.startAt).getTime();
  if (Number.isNaN(startTime)) {
    return false;
  }
  return startTime + GRACE_PERIOD_MS <= Date.now();
}

function isWithinLookback(booking) {
  if (!booking?.startAt) {
    return false;
  }
  const startTime = new Date(booking.startAt).getTime();
  if (Number.isNaN(startTime)) {
    return false;
  }
  return startTime >= Date.now() - LOOKBACK_MS;
}

async function chargeBooking({ booking, cardId, feeMoney, locationId }) {
  const bookingId = booking.id;
  const requestBody = {
    sourceId: cardId,
    idempotencyKey: buildPaymentIdempotencyKey(bookingId, feeMoney.amount),
    amountMoney: feeMoney,
    customerId: booking.customerId || undefined,
    locationId,
    referenceId: bookingId || undefined,
    note: `No-show fee for booking ${bookingId}`
  };

  const response = await client.payments.create(requestBody);
  const payment = response?.payment || response?.result?.payment || response?.data?.payment;
  if (!payment) {
    throw new Error('Payment API response did not include a payment record.');
  }

  try {
    await markBookingCharged({ booking, cardId, feeMoney, paymentId: payment.id });
  } catch (error) {
    throw new Error(`Charged payment ${payment.id} but failed to update booking note: ${error?.message || error}`);
  }

  console.log(`✅ Charged ${formatMoney(feeMoney)} for booking ${bookingId} (payment ${payment.id}).`);
}

async function processBookings() {
  const locationId = await getLocationId();

  const nowIso = new Date().toISOString();
  const lookbackIso = new Date(Date.now() - LOOKBACK_MS).toISOString();
  const bookingsPage = await client.bookings.list({
    locationId,
    startAtMin: lookbackIso,
    startAtMax: nowIso,
    limit: 100
  });

  for await (const booking of bookingsPage) {
    const bookingId = booking?.id || 'unknown';
    summary.processed += 1;

    if (booking.status !== 'NO_SHOW') {
      logSkip(bookingId, `status ${booking.status}`);
      continue;
    }

    if (!isWithinLookback(booking)) {
      logSkip(bookingId, 'outside lookback window');
      continue;
    }

    if (!hasGracePeriodElapsed(booking)) {
      logSkip(bookingId, `still within ${GRACE_PERIOD_HOURS}h grace period`);
      continue;
    }

    if (!bookingId) {
      logSkip(bookingId, 'missing booking ID');
      continue;
    }

    const noteDetails = getSellerNoteDetails(booking.sellerNote);
    const cardId = noteDetails.cardId || extractCardId(booking.sellerNote);
    if (!cardId) {
      logSkip(bookingId, 'no stored card ID found');
      continue;
    }

    let serviceMoney;
    try {
      serviceMoney = await getBookingServicePriceMoney(booking);
    } catch (error) {
      logError(bookingId, error);
      continue;
    }

    if (!serviceMoney) {
      logSkip(bookingId, 'no service price available');
      continue;
    }

    const feeMoney = calculateNoShowFee(serviceMoney);
    if (!feeMoney) {
      logSkip(bookingId, 'no-show fee calculated as $0');
      continue;
    }

    if (noteDetails.chargedCents != null) {
      const recordedAmount = noteDetails.chargedCents;
      const recordedCurrency = noteDetails.chargedCurrency || feeMoney.currency;
      if (recordedAmount === feeMoney.amount && recordedCurrency === feeMoney.currency) {
        logSkip(bookingId, 'no-show fee already recorded on booking');
        continue;
      }

      if (recordedAmount > 0n) {
        logSkip(
          bookingId,
          `booking seller note already shows ${formatMoney({ amount: recordedAmount, currency: recordedCurrency })}`
        );
        continue;
      }
    }

    summary.eligible += 1;

    try {
      await chargeBooking({ booking, cardId, feeMoney, locationId });
      summary.charged += 1;
    } catch (error) {
      logError(bookingId, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting daily no-show fee cron run...');
  console.log(`   Grace period: ${GRACE_PERIOD_HOURS} hours | Lookback: ${LOOKBACK_DAYS} days`);

  try {
    await processBookings();
  } catch (error) {
    console.error('❌ Fatal error while processing bookings:', error);
    process.exit(1);
  }

  console.log('––––––––––––––––––––––––––––––––––––');
  console.log(`Processed bookings: ${summary.processed}`);
  console.log(`Eligible for charge: ${summary.eligible}`);
  console.log(`Charged successfully: ${summary.charged}`);
  console.log(`Skipped: ${summary.skipped.length}`);
  console.log(`Errors: ${summary.errors.length}`);

  if (summary.skipped.length) {
    console.log('\nSkipped bookings:');
    for (const message of summary.skipped) {
      console.log(` • ${message}`);
    }
  }

  if (summary.errors.length) {
    console.log('\nErrors:');
    for (const message of summary.errors) {
      console.log(` • ${message}`);
    }
  }

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

main();
