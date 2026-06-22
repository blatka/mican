import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Share } from 'lucide-react'
import { fetchAdsByOrgId, fetchOrgsForSponsorship, fetchMediaUrl, pickAd } from '../api/index.js'
import { decodeHtml } from '../utils/html.js'
import { trackSponsorImpression, trackSponsorClick } from '../utils/analytics.js'
import { SPONSORSHIP_TIERS, HOME_TIERS } from '../constants/sponsors.js'

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const alreadyInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone
    if (alreadyInstalled || localStorage.getItem('installDismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios|chrome/i.test(navigator.userAgent)

    if (ios && safari) {
      setIsIOS(true)
      setShow(true)
      return
    }

    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null)
      setShow(false)
    })
  }

  function dismiss() {
    localStorage.setItem('installDismissed', '1')
    setShow(false)
  }

  return { show, isIOS, install, dismiss }
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const [featuredSponsor, setFeaturedSponsor] = useState(null)
  const { show: showInstall, isIOS, install, dismiss } = useInstallPrompt()

  useEffect(() => {
    async function load() {
      try {
        const [adsByOrg, ...tierOrgArrays] = await Promise.all([
          fetchAdsByOrgId(),
          ...HOME_TIERS.map(id => fetchOrgsForSponsorship(id)),
        ])

        // Pool all orgs from HOME_TIERS (deduplicated), pick one randomly
        const seenIds = new Set()
        const pool = []
        for (let i = 0; i < HOME_TIERS.length; i++) {
          for (const org of (tierOrgArrays[i] ?? [])) {
            if (seenIds.has(org.id)) continue
            seenIds.add(org.id)
            pool.push({ org, tier: SPONSORSHIP_TIERS[HOME_TIERS[i]] })
          }
        }
        if (pool.length === 0) return

        const { org, tier } = pool[Math.floor(Math.random() * pool.length)]
        const found = { ad: pickAd(adsByOrg, org.id), tier, org }

        const imageUrl = found.org.featured_media
          ? await fetchMediaUrl(found.org.featured_media)
          : null

        setFeaturedSponsor({ ...found, imageUrl })
        trackSponsorImpression(
          found.org.id,
          decodeHtml(found.org.title?.rendered),
          found.tier.label,
          'home'
        )
      } catch (e) {
        console.warn('HomeScreen sponsor load failed:', e)
      }
    }
    load()
  }, [])

  return (
    <div className="screen" style={{ background: '#F7F8FA' }}>
      <div style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }} />

      {/* Hero image */}
      <img
        src="/assets/summit-hero.png"
        alt="MiCAN Annual Summit"
        style={{ width: '100%', display: 'block' }}
      />

      {/* Install banner */}
      {showInstall && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={styles.installBanner}>
            <div style={styles.installText}>
              {isIOS ? (
                <>
                  <span style={styles.installTitle}>Add to Home Screen</span>
                  <span style={styles.installHint}>
                    Tap <Share size={12} strokeWidth={2.5} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> then <strong>Add to Home Screen</strong> for the best experience
                  </span>
                </>
              ) : (
                <>
                  <span style={styles.installTitle}>Add to Home Screen</span>
                  <span style={styles.installHint}>Install for quick access — no app store needed</span>
                </>
              )}
            </div>
            <div style={styles.installActions}>
              {!isIOS && (
                <button style={styles.installBtn} onClick={install}>Install</button>
              )}
              <button style={styles.dismissBtn} onClick={dismiss}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={styles.ctaGreen} onClick={() => navigate('/schedule')}>
          <Calendar size={18} strokeWidth={2.5} stroke="#FFFFFF" />
          View Schedule
        </button>
        <button style={styles.ctaNavy} onClick={() => navigate('/map')}>
          <MapPin size={18} strokeWidth={2.5} stroke="#FFFFFF" />
          Venue Map
        </button>
        <button style={{ ...styles.ctaGreen, padding: '10px 18px' }} onClick={() => window.open('https://community.miclimateaction.org/', '_blank', 'noopener,noreferrer')}>
          <img src="/assets/micommunity-icon-white.svg" alt="" style={{ width: 36, height: 36 }} />
          MiCommunity
        </button>
      </div>

      {/* Featured sponsor card */}
      {featuredSponsor && (() => {
        const hasAd = !!featuredSponsor.ad
        const websiteUrl = featuredSponsor.org.meta?.organization_link ?? null
        function handleSponsorClick() {
          trackSponsorClick(featuredSponsor.org.id, decodeHtml(featuredSponsor.org.title?.rendered), featuredSponsor.tier.label, 'home')
          if (hasAd) navigate(`/sponsor-detail/${featuredSponsor.org.id}`)
          else if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer')
        }
        return (
          <div style={{ padding: '24px 16px 0' }}>
            <div style={styles.tierLabel}>{featuredSponsor.tier.label.toUpperCase()} SPONSOR</div>
            <div
              style={styles.sponsorCard}
              onClick={handleSponsorClick}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleSponsorClick()}
            >
              <div style={styles.cardHeader}>
                {featuredSponsor.imageUrl && (
                  <div style={styles.cardLogoCircle}>
                    <img
                      src={featuredSponsor.imageUrl}
                      alt={decodeHtml(featuredSponsor.org.title?.rendered)}
                      style={styles.cardLogo}
                    />
                  </div>
                )}
                <div style={styles.cardOrgName}>
                  {decodeHtml(featuredSponsor.org.title?.rendered)}
                </div>
                {featuredSponsor.ad?.meta?.ad_headline && (
                  <div style={styles.cardTagline}>
                    {featuredSponsor.ad.meta.ad_headline}
                  </div>
                )}
              </div>
              <div style={styles.cardBody}>
                <button
                  style={{ ...styles.learnMore, background: featuredSponsor.tier.color }}
                  onClick={e => { e.stopPropagation(); handleSponsorClick() }}
                >
                  {hasAd ? 'LEARN MORE' : 'VISIT WEBSITE'} &rsaquo;
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Footer */}
      <div style={styles.footer}>
        <img src="/assets/mican-logo-bug.png" alt="MiCAN" style={{ height: 28 }} />
        <span style={styles.footerText}>Powered by MiCAN</span>
      </div>

      {/* bottom padding for tab bar */}
      <div style={{ height: 16 }} />
    </div>
  )
}

const styles = {
  ctaGreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 16,
    borderRadius: 14,
    padding: 18,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(57,128,50,0.3)',
    width: '100%',
  },
  ctaNavy: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: '#1E2B5F',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 16,
    borderRadius: 14,
    padding: 18,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  tierLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sponsorCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #1E2B5F',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #1E2B5F, #042A80)',
    padding: '20px 24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  cardLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardLogo: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
  },
  cardOrgName: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardTagline: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  cardBody: {
    padding: '16px 20px',
  },
  learnMore: {
    width: '100%',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: '#FFFFFF',
    borderRadius: 10,
    padding: '12px 0',
    border: 'none',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '28px 0 16px',
  },
  footerText: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: 700,
  },
  installBanner: {
    background: '#7C0770',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  installText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  installTitle: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 13,
    color: '#FFFFFF',
  },
  installHint: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.4,
  },
  installActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  installBtn: {
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 13,
    borderRadius: 8,
    padding: '8px 14px',
    border: 'none',
    cursor: 'pointer',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 2px',
    lineHeight: 1,
  },
}
