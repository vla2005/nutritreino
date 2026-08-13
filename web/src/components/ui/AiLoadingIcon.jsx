export default function AiLoadingIcon({ className = '' }) {
  return (
    <svg className={`ai-loading-icon ${className}`.trim()} viewBox="0 0 512 512" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ai-loader-main" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a68cfa" />
          <stop offset="0.5" stopColor="#828cf7" />
          <stop offset="1" stopColor="#6366f2" />
        </linearGradient>
        <linearGradient id="ai-loader-soft" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fc" />
          <stop offset="0.5" stopColor="#a6b5fc" />
          <stop offset="1" stopColor="#828cf7" />
        </linearGradient>
      </defs>

      <g className="ai-loader-orbit ai-loader-orbit-one">
        <path fill="url(#ai-loader-main)" d="M28 0l6.93 21.07L56 28l-21.07 6.93L28 56l-6.93-21.07L0 28l21.07-6.93L28 0z" />
      </g>

      <g className="ai-loader-orbit ai-loader-orbit-two">
        <path fill="url(#ai-loader-soft)" d="M18 0l4.45 13.55L36 18l-13.55 4.45L18 36l-4.45-13.55L0 18l13.55-4.45L18 0z" />
      </g>

      <g className="ai-loader-main-glow">
        <path fill="url(#ai-loader-soft)" d="M91 0l22.52 68.48L182 91l-68.48 22.52L91 182l-22.52-68.48L0 91l68.48-22.52L91 0z" />
      </g>

      <g className="ai-loader-main-star">
        <path fill="url(#ai-loader-main)" d="M70 0l17.32 52.68L140 70 87.32 87.32 70 140 52.68 87.32 0 70l52.68-17.32L70 0z" />
      </g>
    </svg>
  )
}
