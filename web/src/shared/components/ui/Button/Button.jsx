export default function Button({ children, loading = false, disabled = false, placeholder = '', className = '', onClick }) {
  return (
    <button
      type="button"
      className={`btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm ${className}`}
      disabled={disabled || loading}
      onClick={() => {
        if (!disabled && !loading) onClick?.()
      }}
    >
      {loading ? (
        <svg className="spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <>
          {placeholder}
          {children}
        </>
      )}
    </button>
  )
}
