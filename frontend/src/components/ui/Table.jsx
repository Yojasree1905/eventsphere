export function Table({ headers = [], children, emptyMessage = 'No records found' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/70">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  )
}
