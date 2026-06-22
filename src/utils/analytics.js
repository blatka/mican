/**
 * Fire a sponsor impression event to GA4.
 * Shows up in GA as a custom event named "sponsor_impression".
 *
 * @param {number|string} orgId   - WordPress org post ID
 * @param {string}        name    - Org display name
 * @param {string}        tier    - Tier label e.g. "Activism Ally"
 * @param {string}        placement - Where it appeared: "home", "schedule_feed", "session_featured", "session_nonprofit"
 */
export function trackSponsorImpression(orgId, name, tier, placement) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'sponsor_impression', {
    sponsor_id: String(orgId),
    sponsor_name: name,
    sponsor_tier: tier,
    placement,
  })
}

export function trackSponsorClick(orgId, name, tier, placement) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'sponsor_click', {
    sponsor_id: String(orgId),
    sponsor_name: name,
    sponsor_tier: tier,
    placement,
  })
}
