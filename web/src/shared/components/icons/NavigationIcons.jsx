const iconClass = 'h-[18px] w-[18px]'

export function PathIcon({ d }) {
  return <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
}

export function DumbbellIcon() {
  return <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path d="M6 8V16M18 8V16M4 10V14M20 10V14M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

export function AppleIcon() {
  return (
    <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path d="M12 7c1.4-2.1 3.2-2.9 5.4-2.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 7c-1.5-2.3-3.4-2.9-5.5-1.8C4.2 6.4 3.4 9.5 4.3 13c1.2 4.6 4.1 7.3 6.4 6.2.8-.4 1.8-.4 2.6 0 2.3 1.1 5.2-1.6 6.4-6.2.9-3.5.1-6.6-2.2-7.8-2.1-1.1-4-.5-5.5 1.8Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5c.1-1.8.9-3 2.4-3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}
