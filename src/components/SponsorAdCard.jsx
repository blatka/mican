import { useNavigate } from 'react-router-dom'

// Inline ad card injected into the session list every 3 sessions
export default function SponsorAdCard({ ad, logoUrl, tierLabel, orgId, detailPage, orgName, websiteUrl }) {
  const navigate = useNavigate()
  if (!ad && !orgName && !logoUrl) return null

  const meta = ad?.meta ?? {}

  function handleClick() {
    if (ad) {
      detailPage ? navigate(`/sponsor-detail/${orgId}`) : navigate(`/sponsor-ad/${ad.id}`)
    } else if (websiteUrl) {
      window.open(websiteUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const displayName = meta.ad_headline || orgName || ad?.title?.rendered || ''

  const isClickable = !!(ad || websiteUrl)

  return (
    <div
      style={styles.card}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? e => e.key === 'Enter' && handleClick() : undefined}
    >
      <div style={styles.header}>
        <span style={styles.tierLabel}>{tierLabel ? `${tierLabel.toUpperCase()} SPONSOR` : 'FEATURED SPONSOR'}</span>
      </div>
      <div style={styles.body}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt={displayName}
            style={styles.logo}
          />
        )}
        <div style={styles.name}>{displayName}</div>
        {meta.ad_text_1 && (
          <div style={styles.tagline}>{meta.ad_text_1.slice(0, 80)}{meta.ad_text_1.length > 80 ? '...' : ''}</div>
        )}
        {isClickable && (
          <button style={styles.cta}>{ad ? 'LEARN MORE' : 'VISIT WEBSITE'}</button>
        )}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  header: {
    background: '#F9F9F9',
    paddingBottom: 17,
    paddingTop: 14,
    textAlign: 'center',
  },
  tierLabel: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    color: '#9CA3AF',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  body: {
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    height: 48,
    maxWidth: 120,
    objectFit: 'contain',
    borderRadius: 8,
  },
  name: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    color: '#0D1117',
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    color: '#5A6272',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  cta: {
    background: '#398032',
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 12,
    borderRadius: 8,
    padding: '8px 20px',
    border: 'none',
    cursor: 'pointer',
    marginTop: 4,
  },
}
