export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name || Math.random().toString(36).substring(7)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border text-sm transition-colors duration-150 placeholder:text-slate-400 bg-white
            ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2
            ${
              error
                ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500 hover:border-slate-400'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  )
}

export function Select({
  label,
  error,
  options = [],
  className = '',
  id,
  ...props
}) {
  const selectId = id || props.name || Math.random().toString(36).substring(7)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg border text-sm px-3.5 py-2 bg-white transition-colors duration-150
          ${
            error
              ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500 hover:border-slate-400'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0`}
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt
          const labelText = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          )
        })}
      </select>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}
