import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import {
  fetchAdsByOrgId, fetchOrgSponsorshipRelations, fetchOrganizations, fetchMediaUrls,
} from '../api/index.js'
import { SPONSORSHIP_TIERS, DISPLAYED_TIERS } from '../constants/sponsors.js'
import { decodeHtml } from '../utils/html.js'

const NONPROFIT_ID = 8979

export default function SponsorsScreen() {
  const navigate = useNavigate()
  const [sections, setSections] = useState(() =>
    DISPLAYED_TIERS.map(id => ({ sponsorshipId: id, tier: SPONSORSHIP_TIERS[id], orgItems: [] }))
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [adsByOrg, relMap] = await Promise.all([
          fetchAdsByOrgId(),
          fetchOrgSponsorshipRelations(),
        ])
        const orgTierMap = {}
        for (const [orgIdStr, children] of Object.entries(relMap)) {
          const orgId = Number(orgIdStr)
          for (const { child_object_id } of children) {
            const tierId = Number(child_object_id)
            const tier = SPONSORSHIP_TIERS[tierId]
            if (!tier) continue
            const existing = SPONSORSHIP_TIERS[orgTierMap[orgId]]
            if (!existing || (tier.weight ?? 0) >= (existing.weight ?? 0)) {
              orgTierMap[orgId] = tierId
            }
          }
        }

        const allOrgIds = Object.keys(orgTierMap).map(Number)
        const orgs = allOrgIds.length > 0 ? await fetchOrganizations(allOrgIds) : []
        const mediaIds = orgs.map(o => o.featured_media).filter(Boolean)
        const mediaMap = mediaIds.length > 0 ? await fetchMediaUrls(mediaIds) : {}

        const tierGroups = {}
        for (const org of orgs) {
          const tierId = orgTierMap[org.id]
          if (!tierId) continue
          if (!tierGroups[tierId]) tierGroups[tierId] = []
          tierGroups[tierId].push({
            id: org.id,
            name: decodeHtml(org.title?.rendered),
            logoUrl: org.featured_media ? (mediaMap[org.featured_media] ?? null) : null,
            websiteUrl: org.meta?.organization_link ?? null,
            ad: adsByOrg[org.id] ?? null,
          })
        }

        setSections(DISPLAYED_TIERS.map(id => ({
          sponsorshipId: id,
          tier: SPONSORSHIP_TIERS[id],
          orgItems: (tierGroups[id] ?? []).sort((a, b) => a.name.localeCompare(b.name)),
        })))
      } catch (e) {
        console.warn('SponsorsScreen load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleTap(sponsorshipId, tier, org) {
    if (sponsorshipId === NONPROFIT_ID) {
      if (org.websiteUrl) window.open(org.websiteUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (org.ad) {
      if (tier.detailPage) {
        navigate(`/sponsor-detail/${org.id}`)
      } else {
        navigate(`/sponsor-ad/${org.ad.id}`)
      }
      return
    }
    if (org.websiteUrl) {
      window.open(org.websiteUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function ctaLabel(sponsorshipId, tier, org) {
    if (sponsorshipId === NONPROFIT_ID) return 'Visit'
    if (org.ad) return tier.detailPage ? 'Learn More' : 'View'
    return 'Visit'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="screen-header" style={{ paddingBottom: 14 }}>
        <div style={{ padding: '12px 16px 0', textAlign: 'center' }}>
          <span style={styles.pageTitle}>Summit Sponsors</span>
        </div>
      </div>

      <div className="screen" style={{ padding: '16px 16px 0' }}>
        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {!loading && sections.map(({ sponsorshipId, tier, orgItems }) => (
          <div key={sponsorshipId}>
            <TierHeading label={tier.label} />

            {orgItems.length === 0 && (
              <div style={styles.emptyTier}>No sponsors listed yet</div>
            )}

            {orgItems.map(org => (
              <div
                key={org.id}
                style={tier.detailPage ? styles.card : styles.row}
                onClick={() => handleTap(sponsorshipId, tier, org)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleTap(sponsorshipId, tier, org)}
              >
                {tier.detailPage ? (
                  <>
                    <div style={styles.cardHeader}>
                      <LogoBox logoUrl={org.logoUrl} name={org.name} size={120} />
                      <div style={styles.cardText}>
                        <div style={styles.cardName}>{org.name}</div>
                        {org.ad?.meta?.ad_headline && (
                          <div style={styles.cardTagline}>{org.ad.meta.ad_headline}</div>
                        )}
                      </div>
                    </div>
                    <div style={styles.cardFooter}>
                      <span style={{ ...styles.cta, color: tier.color }}>
                        {ctaLabel(sponsorshipId, tier, org)} &rsaquo;
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <LogoBox logoUrl={org.logoUrl} name={org.name} size={72} radius={8} />
                    <div style={styles.cardText}>
                      <div style={styles.rowName}>{org.name}</div>
                    </div>
                    <span style={{ ...styles.cta, color: tier.color, flexShrink: 0 }}>
                      {ctaLabel(sponsorshipId, tier, org)} &rsaquo;
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}

function TierHeading({ label }) {
  return (
    <div style={styles.tierHeading}>
      <span style={styles.tierHeadingText}>{label}</span>
    </div>
  )
}

function LogoBox({ logoUrl, name, size = 65, radius = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: '#FFFFFF', border: '1px solid #EAECF0',
      padding: 4, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {logoUrl
        ? <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : <Heart size={size * 0.45} fill="#EBF5E9" stroke="#D4EDD0" strokeWidth={1.5} />
      }
    </div>
  )
}

const styles = {
  pageTitle: {
    fontFamily: "'Block Berthold', serif",
    fontSize: 22,
    color: '#1E2B5F',
  },
  tierHeading: {
    borderBottom: '1px solid #EAECF0',
    marginBottom: 10,
    paddingBottom: 5,
    textAlign: 'center',
  },
  tierHeadingText: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#9CA3AF',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid #EAECF0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 20,
    cursor: 'pointer',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #F4F6FA, #E8EBF2)',
    padding: '9px 8px 9px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  row: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #EAECF0',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 14,
    color: '#001133',
    marginBottom: 2,
  },
  cardTagline: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#5A6272',
    lineHeight: 1.4,
  },
  rowName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    color: '#001133',
  },
  cardFooter: {
    padding: '10px 16px 12px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cta: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 13,
  },
  emptyTier: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: '8px 0 16px',
  },
}
