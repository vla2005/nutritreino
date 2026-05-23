export function useIcons() {
  return { icons }
}

const iconClass = 'h-[18px] w-[18px]'

const icons = {
  home: <PathIcon d="M3 12l9-9 9 9M5 10v10h14V10" />,
  messages: <PathIcon d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
  settings: <PathIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  patients: <PathIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  plans: <AppleIcon />,
  schedule: <PathIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  workouts: <DumbbellIcon />,
  diet: <AppleIcon />,
  progress: <PathIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
}

function PathIcon({ d }) {
  return (
    <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

function DumbbellIcon() {
  return (
    <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path d="M6 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path d="M12 7c1.4-2.1 3.2-2.9 5.4-2.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 7c-1.5-2.3-3.4-2.9-5.5-1.8C4.2 6.4 3.4 9.5 4.3 13c1.2 4.6 4.1 7.3 6.4 6.2.8-.4 1.8-.4 2.6 0 2.3 1.1 5.2-1.6 6.4-6.2.9-3.5.1-6.6-2.2-7.8-2.1-1.1-4-.5-5.5 1.8Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5c.1-1.8.9-3 2.4-3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}
