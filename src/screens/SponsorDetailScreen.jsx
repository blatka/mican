import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { fetchAdsByOrgId, fetchOrganization, fetchMediaUrl } from '../api/index.js'
import { SPONSORSHIP_TIERS } from '../constants/sponsors.js'
import { decodeHtml } from '../utils/html.js'

// Route param is orgId for detail pages
export default function SponsorDetailScreen() {
  const { sponsorshipId: orgId } = useParams()
  const navigate = useNavigate()
  const [ad, setAd] = useState(null)
  const [org, setOrg] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  // Find CI tier for the header label
  const tier = Object.values(SPONSORSHIP_TIERS).find(t => t.detailPage)

  useEffect(() => {
    async function load() {
      try {
        const [adsByOrg, orgData] = await Promise.all([
          fetchAdsByOrgId(),
          fetchOrganization(Number(orgId)),
        ])
        setOrg(orgData)
        const found = adsByOrg[Number(orgId)] ?? null
        if (!found) { setLoading(false); return }
        setAd(found)

        // Logo: prefer org featured_media, fall back to ad_image
        const logoMediaId = orgData?.featured_media || Number(found.meta?.ad_image) || null
        if (logoMediaId) {
          const url = await fetchMediaUrl(logoMediaId)
          setLogoUrl(url)
        }
        // Feature photo: from ad_image
        if (found.meta?.ad_image) {
          setPhotoUrl(await fetchMediaUrl(Number(found.meta.ad_image)))
        }
      } catch (e) {
        console.warn('SponsorDetail load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Gradient header */}
      <div style={styles.gradientHeader}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} strokeWidth={2} stroke="rgba(255,255,255,0.7)" />
          <span>Back</span>
        </button>
        {logoUrl && (
          <div style={styles.logoCircle}>
            <img src={logoUrl} alt="" style={styles.logo} />
          </div>
        )}
        {tier && (
          <div style={styles.tierLabel}>{tier.label.toUpperCase()}</div>
        )}
        {(org || ad) && (
          <div style={styles.orgName}>
            {decodeHtml(org?.title?.rendered) || ad?.meta?.ad_headline}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="screen" style={{ background: '#F7F8FA' }}>
        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {!loading && ad && (
          <div style={{ padding: '24px 24px 0' }}>
            {ad.meta?.ad_text_1 && (
              <>
                <div style={styles.initiativeLabel}>FEATURED INITIATIVE</div>
                <div style={styles.initiativeName}>{ad.meta.ad_headline}</div>
                <p style={styles.bodyText}>{ad.meta.ad_text_1}</p>
              </>
            )}

            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                style={styles.featurePhoto}
              />
            )}

            {ad.meta?.ad_text_2 && (
              <p style={styles.bodyText}>{ad.meta.ad_text_2}</p>
            )}

            {ad.meta?.ad_cta_url && (
              <a
                href={ad.meta.ad_cta_url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.learnMoreBtn}
              >
                {ad.meta.ad_cta_label || 'LEARN MORE'} &rsaquo;
              </a>
            )}
          </div>
        )}

        {!loading && !ad && (
          <div style={{ padding: 24, fontFamily: 'Montserrat, sans-serif', color: '#9CA3AF' }}>
            Sponsor details not available yet.
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

const styles = {
  gradientHeader: {
    background: 'linear-gradient(135deg, #1E2B5F, #042A80)',
    paddingTop: 'max(52px, env(safe-area-inset-top, 52px))',
    padding: 'max(52px, env(safe-area-inset-top, 52px)) 24px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    flexShrink: 0,
  },
  backBtn: {
    position: 'absolute',
    top: 'max(52px, env(safe-area-inset-top, 52px))',
    left: 16,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 0',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 40,
  },
  logo: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
  },
  tierLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  orgName: {
    fontFamily: "'Block Berthold', serif",
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  initiativeLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  initiativeName: {
    fontFamily: "'Block Berthold', serif",
    fontSize: 20,
    color: '#001133',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  bodyText: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    color: '#5A6272',
    lineHeight: 1.7,
    marginBottom: 20,
  },
  featurePhoto: {
    width: 'calc(100% + 0px)',
    height: 200,
    objectFit: 'cover',
    borderRadius: 14,
    marginBottom: 20,
  },
  learnMoreBtn: {
    display: 'block',
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 14,
    borderRadius: 12,
    padding: 16,
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(57,128,50,0.3)',
    marginBottom: 8,
    textDecoration: 'none',
  },
}
