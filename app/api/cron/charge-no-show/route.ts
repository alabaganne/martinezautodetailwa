import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json(
		{ ok: false, error: 'No-show cron is temporarily disabled.' },
		{ status: 503 }
	);
}

export const dynamic = 'force-dynamic';

// import { NextRequest, NextResponse } from 'next/server';
// import { SquareClient, SquareEnvironment } from 'square';
// import { randomUUID, createHash } from 'crypto';

// type MoneyLike = {
// 	amount: bigint;
// 	currency: string;
// };

// type Summary = {
// 	processed: number;
// 	eligible: number;
// 	charged: number;
// 	skipped: string[];
// 	errors: string[];
// };

// const NO_SHOW_FEE_RATE = 0.3;
// const GRACE_PERIOD_HOURS = parseInt(process.env.NO_SHOW_GRACE_PERIOD_HOURS || '24', 10);
// const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000;
// const LOOKBACK_DAYS = parseInt(process.env.NO_SHOW_LOOKBACK_DAYS || '30', 10);
// const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

// function toBigInt(value: unknown): bigint {
// 	if (typeof value === 'bigint') {
// 		return value;
// 	}
// 	if (typeof value === 'number') {
// 		return BigInt(Math.round(value));
// 	}
// 	if (typeof value === 'string') {
// 		return BigInt(value);
// 	}
// 	throw new Error(`Unable to convert value "${String(value)}" to BigInt.`);
// }

// function getVehicleSquareEnvironment(): SquareEnvironment {
// 	return process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
// }

// function buildPaymentIdempotencyKey(bookingId: string | undefined, amount: bigint): string {
// 	const base = `${bookingId || 'unknown'}-${amount.toString()}`;
// 	return createHash('sha256').update(base).digest('hex').slice(0, 45);
// }

// function formatMoney(money: MoneyLike | null): string {
// 	if (!money) {
// 		return '0.00';
// 	}
// 	const amountNumber = Number(money.amount) / 100;
// 	return `${amountNumber.toFixed(2)} ${money.currency}`;
// }

// function extractCardId(note: string | null | undefined): string | null {
// 	const details = getSellerNoteDetails(note);
// 	if (details.cardId) {
// 		return details.cardId;
// 	}
// 	if (typeof note !== 'string') {
// 		return null;
// 	}
// 	const match = note.match(/Card ID:\s*([\w:-]+)/i);
// 	return match ? match[1] : null;
// }

// function getSellerNoteDetails(note: string | null | undefined) {
// 	const details = {
// 		cardId: null as string | null,
// 		chargedCents: null as bigint | null,
// 		chargedCurrency: null as string | null,
// 		chargedAt: null as string | null,
// 		paymentId: null as string | null,
// 		otherTokens: [] as string[],
// 	};

// 	if (typeof note !== 'string' || note.trim() === '') {
// 		return details;
// }

// 	const tokens = note
// 		.split('|')
// 		.map((token) => token.trim())
// 		.filter(Boolean);

// 	for (const token of tokens) {
// 		const [rawKey, ...rawValue] = token.split(':');
// 		if (!rawKey || rawValue.length === 0) {
// 			details.otherTokens.push(token);
// 			continue;
// 		}

// 		const key = rawKey.trim().toLowerCase();
// 		const value = rawValue.join(':').trim();

// 		switch (key) {
// 			case 'card id':
// 				details.cardId = value || null;
// 				break;
// 			case 'no-show fee charged (cents)': {
// 				const numeric = value.replace(/[^0-9-]/g, '');
// 				if (numeric) {
// 					try {
// 						details.chargedCents = BigInt(numeric);
// 					} catch {
// 						details.chargedCents = null;
// 					}
// 				} else if (value === '0') {
// 					details.chargedCents = 0n;
// 				}
// 				break;
// 			}
// 			case 'no-show fee charged currency':
// 				details.chargedCurrency = value || null;
// 				break;
// 			case 'no-show fee charged at':
// 				details.chargedAt = value || null;
// 				break;
// 			case 'no-show fee charged payment id':
// 				details.paymentId = value || null;
// 				break;
// 			default:
// 				details.otherTokens.push(token);
// 				break;
// 		}
// 	}

// 	return details;
// }

// function composeChargedSellerNote({
// 	originalNote,
// 	cardId,
// 	feeMoney,
// 	paymentId,
// }: {
// 	originalNote: string | null | undefined;
// 	cardId: string | null;
// 	feeMoney: MoneyLike | null;
// 	paymentId: string | null;
// }): string {
// 	const details = getSellerNoteDetails(originalNote);
// 	const tokens = details.otherTokens.filter(Boolean);

// 	const resolvedCardId = cardId || details.cardId;
// 	if (resolvedCardId) {
// 		tokens.unshift(`Card ID: ${resolvedCardId}`);
// 	}

// 	const amountCents = feeMoney?.amount != null ? feeMoney.amount.toString() : null;
// 	if (amountCents != null) {
// 		tokens.push(`No-Show Fee Charged (cents): ${amountCents}`);
// 	}

// 	if (feeMoney?.currency) {
// 		tokens.push(`No-Show Fee Charged Currency: ${feeMoney.currency}`);
// 	} else if (details.chargedCurrency) {
// 		tokens.push(`No-Show Fee Charged Currency: ${details.chargedCurrency}`);
// 	}

// 	const chargedAt = new Date().toISOString();
// 	tokens.push(`No-Show Fee Charged At: ${chargedAt}`);

// 	if (paymentId) {
// 		tokens.push(`No-Show Fee Charged Payment ID: ${paymentId}`);
// 	}

// 	return tokens.join(' | ');
// }

// function calculateNoShowFee(serviceMoney: MoneyLike | null): MoneyLike | null {
// 	if (!serviceMoney || serviceMoney.amount == null) {
// 		return null;
// 	}
// 	const amountNumber = Number(serviceMoney.amount);
// 	const feeCents = Math.round(amountNumber * NO_SHOW_FEE_RATE);
// 	if (feeCents <= 0) {
// 		return null;
// 	}
// 	return {
// 		amount: BigInt(feeCents),
// 		currency: serviceMoney.currency || 'USD',
// 	};
// }

// function hasGracePeriodElapsed(booking: any): boolean {
// 	if (!booking?.startAt) {
// 		return false;
// 	}
// 	const startTime = new Date(booking.startAt).getTime();
// 	if (Number.isNaN(startTime)) {
// 		return false;
// 	}
// 	return startTime + GRACE_PERIOD_MS <= Date.now();
// }

// function isWithinLookback(booking: any): boolean {
// 	if (!booking?.startAt) {
// 		return false;
// 	}
// 	const startTime = new Date(booking.startAt).getTime();
// 	if (Number.isNaN(startTime)) {
// 		return false;
// 	}
// 	return startTime >= Date.now() - LOOKBACK_MS;
// }

// async function runNoShowFeeJob(): Promise<Summary> {
// 	const accessToken = process.env.SQUARE_ACCESS_TOKEN;
// 	if (!accessToken) {
// 		throw new Error('SQUARE_ACCESS_TOKEN not configured.');
// 	}

// 	const client = new SquareClient({
// 		token: accessToken,
// 		environment: getVehicleSquareEnvironment(),
// 		userAgentDetail: 'car-wash-no-show-cron-api',
// 	});

// 	const summary: Summary = {
// 		processed: 0,
// 		eligible: 0,
// 		charged: 0,
// 		skipped: [],
// 		errors: [],
// 	};

// 	const variationPriceCache = new Map<string, MoneyLike>();

// 	function logSkip(bookingId: string | null, reason: string) {
// 		const message = `${bookingId ? `Booking ${bookingId}` : 'Booking'} skipped: ${reason}`;
// 		summary.skipped.push(message);
// 		console.log(`⚪ ${message}`);
// 	}

// 	function logError(bookingId: string | null, error: unknown) {
// 		const typedError = error as any;
// 		const errorsList = typedError?.errors?.map((e: any) => e?.detail).filter(Boolean);
// 		const errorMessage = typedError?.message || (errorsList?.length ? errorsList.join(', ') : null) || String(error);
// 		const message = `${bookingId ? `Booking ${bookingId}` : 'Booking'} failed: ${errorMessage}`;
// 		summary.errors.push(message);
// 		console.error(`✗ ${message}`);
// 	}

// 	async function getLocationId(): Promise<string> {
// 		const response = await client.locations.list();
// 		const locations = response?.locations || response?.result?.locations || [];
// 		if (!locations.length) {
// 			throw new Error('No Square locations available.');
// 		}
// 		return locations[0].id;
// 	}

// 	async function getVariationPriceMoney(variationId: string | null | undefined): Promise<MoneyLike | null> {
// 		if (!variationId) {
// 			return null;
// 		}
// 		if (variationPriceCache.has(variationId)) {
// 			return variationPriceCache.get(variationId) ?? null;
// 		}

// 		const response = await client.catalog.object.get({ objectId: variationId });
// 		const variation = response?.object || response?.result?.object || response?.data?.object;
// 		const priceMoney = variation?.itemVariationData?.priceMoney;

// 		if (!priceMoney || priceMoney.amount == null) {
// 			throw new Error(`No price found for service variation ${variationId}.`);
// 		}

// 		const normalized: MoneyLike = {
// 			amount: toBigInt(priceMoney.amount),
// 			currency: priceMoney.currency || 'USD',
// 		};
// 		variationPriceCache.set(variationId, normalized);
// 		return normalized;
// 	}

// 	async function getBookingServicePriceMoney(booking: any): Promise<MoneyLike | null> {
// 		const segments = Array.isArray(booking?.appointmentSegments) ? booking.appointmentSegments : [];
// 		if (!segments.length) {
// 			return null;
// 		}

// 		let totalAmount = 0n;
// 		let currency: string | null = null;

// 		for (const segment of segments) {
// 			const variationId = segment?.serviceVariationId;
// 			if (!variationId) {
// 				continue;
// 			}
// 			const priceMoney = await getVariationPriceMoney(variationId);
// 			if (!priceMoney) {
// 				continue;
// 			}
// 			totalAmount += priceMoney.amount;
// 			currency = currency || priceMoney.currency;
// 		}

// 		if (totalAmount <= 0n) {
// 			return null;
// 		}

// 		return {
// 			amount: totalAmount,
// 			currency: currency || 'USD',
// 		};
// 	}

// 	async function markBookingCharged({
// 		booking,
// 		cardId,
// 		feeMoney,
// 		paymentId,
// 	}: {
// 		booking: any;
// 		cardId: string | null;
// 		feeMoney: MoneyLike;
// 		paymentId: string | null;
// 	}) {
// 		const bookingId = booking?.id;
// 		if (!bookingId) {
// 			throw new Error('Cannot update booking without an ID.');
// 		}

// 		const sellerNote = composeChargedSellerNote({
// 			originalNote: booking.sellerNote,
// 			cardId,
// 			feeMoney,
// 			paymentId,
// 		});

// 		const bookingPayload: Record<string, unknown> = {
// 			sellerNote,
// 		};

// 		if (booking?.version != null) {
// 			bookingPayload.version = booking.version;
// 		}

// 		await client.bookings.update({
// 			bookingId,
// 			idempotencyKey: randomUUID(),
// 			booking: bookingPayload,
// 		});
// 	}

// 	async function chargeBooking({
// 		booking,
// 		cardId,
// 		feeMoney,
// 		locationId,
// 	}: {
// 		booking: any;
// 		cardId: string;
// 		feeMoney: MoneyLike;
// 		locationId: string;
// 	}) {
// 		const bookingId: string | undefined = booking.id;
// 		const requestBody = {
// 			sourceId: cardId,
// 			idempotencyKey: buildPaymentIdempotencyKey(bookingId, feeMoney.amount),
// 			amountMoney: feeMoney,
// 			customerId: booking.customerId || undefined,
// 			locationId,
// 			referenceId: bookingId || undefined,
// 			note: `No-show fee for booking ${bookingId}`,
// 		};

// 		const response = await client.payments.create(requestBody);
// 		const payment = response?.payment || response?.result?.payment || response?.data?.payment;
// 		if (!payment) {
// 			throw new Error('Payment API response did not include a payment record.');
// 		}

// 		try {
// 			await markBookingCharged({ booking, cardId, feeMoney, paymentId: payment.id });
// 		} catch (error) {
// 			throw new Error(
// 				`Charged payment ${payment.id} but failed to update booking note: ${(error as Error)?.message || error}`
// 			);
// 		}

// 		console.log(`✅ Charged ${formatMoney(feeMoney)} for booking ${bookingId} (payment ${payment.id}).`);
// 	}

// 	async function processBookings() {
// 		const locationId = await getLocationId();

// 		const nowIso = new Date().toISOString();
// 		const lookbackIso = new Date(Date.now() - LOOKBACK_MS).toISOString();

// 		const bookingsApi: any = (client as any).bookings ?? (client as any).bookingsApi;
// 		if (!bookingsApi?.list) {
// 			throw new Error('Square bookings API client is not available.');
// 		}

// 		const bookingsPage: any = await bookingsApi.list({
// 			locationId,
// 			startAtMin: lookbackIso,
// 			startAtMax: nowIso,
// 			limit: 100,
// 		});

// 		for await (const booking of bookingsPage as any) {
// 			const bookingId: string = booking?.id || 'unknown';
// 			summary.processed += 1;

// 			if (booking.status !== 'NO_SHOW') {
// 				logSkip(bookingId, `status ${booking.status}`);
// 				continue;
// 			}

// 			if (!isWithinLookback(booking)) {
// 				logSkip(bookingId, 'outside lookback window');
// 				continue;
// 			}

// 			if (!hasGracePeriodElapsed(booking)) {
// 				logSkip(bookingId, `still within ${GRACE_PERIOD_HOURS}h grace period`);
// 				continue;
// 			}

// 			if (!bookingId) {
// 				logSkip(bookingId, 'missing booking ID');
// 				continue;
// 			}

// 			const noteDetails = getSellerNoteDetails(booking.sellerNote);
// 			const cardId = noteDetails.cardId || extractCardId(booking.sellerNote);
// 			if (!cardId) {
// 				logSkip(bookingId, 'no stored card ID found');
// 				continue;
// 			}

// 			let serviceMoney: MoneyLike | null = null;
// 			try {
// 				serviceMoney = await getBookingServicePriceMoney(booking);
// 			} catch (error) {
// 				logError(bookingId, error);
// 				continue;
// 			}

// 			if (!serviceMoney) {
// 				logSkip(bookingId, 'no service price available');
// 				continue;
// 			}

// 			const feeMoney = calculateNoShowFee(serviceMoney);
// 			if (!feeMoney) {
// 				logSkip(bookingId, 'no-show fee calculated as $0');
// 				continue;
// 			}

// 			if (noteDetails.chargedCents != null) {
// 				const recordedAmount = noteDetails.chargedCents;
// 				const recordedCurrency = noteDetails.chargedCurrency || feeMoney.currency;
// 				if (recordedAmount === feeMoney.amount && recordedCurrency === feeMoney.currency) {
// 					logSkip(bookingId, 'no-show fee already recorded on booking');
// 					continue;
// 				}

// 				if (recordedAmount > 0n) {
// 					logSkip(
// 						bookingId,
// 						`booking seller note already shows ${formatMoney({ amount: recordedAmount, currency: recordedCurrency })}`
// 					);
// 					continue;
// 				}
// 			}

// 			summary.eligible += 1;

// 			try {
// 				await chargeBooking({ booking, cardId, feeMoney, locationId });
// 				summary.charged += 1;
// 			} catch (error) {
// 				logError(bookingId, error);
// 			}
// 		}
// 	}

// 	console.log('🚀 Starting no-show fee cron run (API invocation)...');
// 	console.log(`   Grace period: ${GRACE_PERIOD_HOURS} hours | Lookback: ${LOOKBACK_DAYS} days`);

// 	await processBookings();

// 	console.log('––––––––––––––––––––––––––––––––––––');
// 	console.log(`Processed bookings: ${summary.processed}`);
// 	console.log(`Eligible for charge: ${summary.eligible}`);
// 	console.log(`Charged successfully: ${summary.charged}`);
// 	console.log(`Skipped: ${summary.skipped.length}`);
// 	console.log(`Errors: ${summary.errors.length}`);

// 	return summary;
// }

// function getCronSecret(): string | null {
// 	return process.env.NO_SHOW_CRON_SECRET || process.env.CRON_SECRET || null;
// }

// function isAuthorized(request: NextRequest): boolean {
// 	const secret = getCronSecret();
// 	if (!secret) {
// 		return true;
// 	}

// 	const headerSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
// 	if (headerSecret) {
// 		const token = headerSecret.replace(/^Bearer\s+/i, '').trim();
// 		return token === secret;
// 	}

// 	const urlSecret = request.nextUrl.searchParams.get('token') || request.nextUrl.searchParams.get('secret');
// 	return urlSecret === secret;
// }

// export async function GET(request: NextRequest) {
// 	if (!isAuthorized(request)) {
// 		return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
// 	}

// 	try {
// 		const summary = await runNoShowFeeJob();
// 		return NextResponse.json({ ok: true, summary });
// 	} catch (error) {
// 		console.error('No-show cron failed', error);
// 		const typedError = error as any;
// 		const message = typedError?.message || typedError?.toString?.() || 'Unknown error';
// 		return NextResponse.json({ ok: false, error: message }, { status: 500 });
// 	}
// }

// export const dynamic = 'force-dynamic';
