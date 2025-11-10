import "server-only"

import Stripe from "stripe"

let _stripe: Stripe | null = null

// Lazily instantiate the Stripe client to avoid throwing during module
// evaluation (e.g. Next's build/page-data collection) when env vars are
// not available. Callers should call getStripe() when running in server
// runtime where environment secrets are present.
export function getStripe() {
	if (_stripe) return _stripe
	const key = process.env.STRIPE_SECRET_KEY
	if (!key) {
		throw new Error("Stripe secret key is not configured (STRIPE_SECRET_KEY)")
	}
	_stripe = new Stripe(key)
	return _stripe
}

export default getStripe
