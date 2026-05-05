import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { fetchSponsorAd, fetchMediaUrl, fetchOrganization, fetchSponsorshipsByOrg } from '../api/index.js'
import { SPONSORSHIP_TIERS } from '../constants/sponsors.js'
import { decodeHtml } from '../utils/html.js'

export default function SponsorAdPage() {
  const { adId } = useParams()
  const navigate = useNavigate()
  const [ad, setAd] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [logoUrl, setLogoUrl] = useState(null)
  const [tierLabel, setTierLabel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSponsorAd(Number(adId))
        setAd(data)

        const orgId = Number(data.meta?.sponsor_id)
        if (orgId) {
          const [org, sponsorships] = await Promise.all([
            fetchOrganization(orgId).catch(() => null),
            fetchSponsorshipsByOrg(orgId).catch(() => []),
          ])

          // Org name and logo from org's featured_media
          if (org) {
            setOrgName(decodeHtml(org.title?.rendered))
            if (org.featured_media) {
              const url = await fetchMediaUrl(org.featured_media)
              setLogoUrl(url)
            }
          }

          // Tier label
          for (const s of (sponsorships ?? [])) {
            const tier = SPONSORSHIP_TIERS[Number(s.child_object_id)]
            if (tier?.weight) { setTierLabel(tier.label); break }
          }
        }
      } catch (e) {
        console.warn('SponsorAdPage load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [adId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="screen-header" style={{ paddingBottom: 12 }}>
        <div style={{ padding: '8px 16px' }}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={16} strokeWidth={2.5} stroke="#398032" />
            <span>Summit Sponsors</span>
          </button>
        </div>
      </div>

      <div className="screen" style={{ padding: '16px 16px 0' }}>
        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {!loading && ad && (
          <div style={styles.adCard}>
            <div style={styles.adHeader}>
              <span style={styles.tierLabel}>{tierLabel ? `${tierLabel.toUpperCase()} SPONSOR` : 'SUMMIT SPONSOR'}</span>
            </div>

            <div style={styles.adBody}>
              {/* Org logo */}
              {logoUrl && (
                <img src={logoUrl} alt={orgName} style={styles.logo} />
              )}

              {/* Org name — bold, centered */}
              {orgName && (
                <div style={styles.orgName}>{orgName}</div>
              )}

              {/* Initiative headline — bold, left-aligned */}
              {ad.meta?.ad_headline && (
                <div style={styles.adHeadline}>{ad.meta.ad_headline}</div>
              )}

              {/* Body text */}
              {ad.meta?.ad_text_1 && (
                <p style={styles.bodyText}>{ad.meta.ad_text_1}</p>
              )}

              {ad.meta?.ad_cta_url && (
                <a
                  href={ad.meta.ad_cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.ctaBtn}
                >
                  {ad.meta.ad_cta_label || 'VISIT WEBSITE'}
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const styles = {
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    color: '#398032',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 0',
  },
  adCard: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #EAECF0',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  adHeader: {
    background: '#F9F9F9',
    padding: '14px 16px 17px',
    textAlign: 'center',
  },
  tierLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9CA3AF',
  },
  adBody: {
    padding: '20px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    maxHeight: 64,
    maxWidth: '70%',
    objectFit: 'contain',
  },
  orgName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 17,
    color: '#0D1117',
    textAlign: 'center',
  },
  adHeadline: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 14,
    color: '#001133',
    alignSelf: 'flex-start',
    width: '100%',
  },
  bodyText: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    color: '#5A6272',
    lineHeight: 1.7,
    textAlign: 'left',
    width: '100%',
    margin: 0,
  },
  ctaBtn: {
    display: 'block',
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: '0.04em',
    borderRadius: 10,
    padding: '14px 24px',
    textAlign: 'center',
    width: '100%',
    boxShadow: '0 4px 16px rgba(57,128,50,0.3)',
    textDecoration: 'none',
    marginTop: 4,
  },
}
