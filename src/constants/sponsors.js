// 2026 sponsor tier definitions — keyed by sponsorship post ID
// Paid tiers in descending order; weight drives relative ad frequency in session feed
export const SPONSORSHIP_TIERS = {
  8984: { label: 'Climate Innovator',   order: 1, weight: 5, color: '#1E2B5F', detailPage: true },
  8983: { label: 'Activism Ally',       order: 2, weight: 4, color: '#1E2B5F', detailPage: true },
  8982: { label: 'Grassroots Guardian', order: 3, weight: 3, color: '#398032', detailPage: true },
  8981: { label: 'Planet Protector',    order: 4, weight: 2, color: '#398032', detailPage: true },
  8980: { label: 'Community Pillar',    order: 5, weight: 1, color: '#398032', detailPage: true },
  8979: { label: 'Nonprofit Partner',   order: 6,            color: '#398032', detailPage: false, externalOnly: true },
}

// All tiers shown on the Sponsors screen, highest to lowest
export const DISPLAYED_TIERS = [8984, 8983, 8982, 8981, 8980, 8979]

// Paid tiers only (excludes nonprofit — used for ad weighting)
export const PAID_TIERS = [8984, 8983, 8982, 8981, 8980]
