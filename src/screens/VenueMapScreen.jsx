export default function VenueMapScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        paddingTop: 'max(52px, env(safe-area-inset-top, 52px))',
        flexShrink: 0,
        background: '#F7F8FA',
      }} />

      <div className="screen" style={{ background: '#F7F8FA' }}>
        <img
          src="/assets/kellogg-floor-plan-v2.png"
          alt="Kellogg Center Floor Plan"
          style={{ width: '100%', display: 'block' }}
        />
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
