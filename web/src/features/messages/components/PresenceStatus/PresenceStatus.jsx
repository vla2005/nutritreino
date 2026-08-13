export default function PresenceStatus({ participant }) {
  return (
    <span className={`messages-status-label ${participant?.is_online ? 'is-online' : ''}`}>
      <PresenceDot online={participant?.is_online} />
      {participant?.is_online ? 'Online' : 'Offline'}
    </span>
  )
}

export function PresenceDot({ online }) {
  return <i className={`messages-presence-dot ${online ? 'is-online' : ''}`} aria-hidden="true" />
}
