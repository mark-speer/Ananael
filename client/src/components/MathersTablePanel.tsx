import {
  MATHERS_TABLE,
  MATHERS_TABLE_SOURCE,
} from '../data/gematria/mathersTable';

/**
 * Reference chart: Mathers' Table of Hebrew and Chaldee Letters.
 */
export default function MathersTablePanel() {
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-ananael-muted">
        Pronunciation, forms, values, and name significations for the
        twenty-two Hebrew letters as given by Mathers.
      </p>

      <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface">
        {/* Phone layout: one card per letter */}
        <ul className="divide-y divide-ananael-border/30 md:hidden">
          {MATHERS_TABLE.map((row) => (
            <li key={row.number} className="p-3">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl leading-none text-zinc-100">
                  {row.letter}
                  {row.finalLetter && (
                    <span className="ml-1.5 text-zinc-400">
                      {row.finalLetter}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-100">
                    {row.name}
                    <span className="text-ananael-muted"> · {row.roman}</span>
                  </p>
                  <p className="text-xs text-ananael-muted">{row.sound}</p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-sm text-ananael-gold">
                    {row.value}
                    {row.finalValue != null && (
                      <span className="text-ananael-bronze">
                        {' '}
                        / {row.finalValue}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-ananael-muted">
                    No. {row.number}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                {row.signification}
              </p>
            </li>
          ))}
        </ul>

        {/* Wider screens: full reference table */}
        <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
              <th className="px-3 py-3 font-medium">No.</th>
              <th className="px-3 py-3 font-medium">Sound</th>
              <th className="px-3 py-3 font-medium">Letter</th>
              <th className="px-3 py-3 font-medium">Final</th>
              <th className="px-3 py-3 font-medium">Value</th>
              <th className="px-3 py-3 font-medium">Final value</th>
              <th className="px-3 py-3 font-medium">Roman</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Signification</th>
            </tr>
          </thead>
          <tbody>
            {MATHERS_TABLE.map((row) => (
              <tr
                key={row.number}
                className="border-b border-ananael-border/30 last:border-0"
              >
                <td className="px-3 py-2 text-ananael-muted">{row.number}</td>
                <td className="px-3 py-2 text-zinc-300">{row.sound}</td>
                <td className="px-3 py-2 font-display text-lg text-zinc-100">
                  {row.letter}
                </td>
                <td className="px-3 py-2 font-display text-lg text-zinc-100">
                  {row.finalLetter ?? '—'}
                </td>
                <td className="px-3 py-2 text-ananael-gold">{row.value}</td>
                <td className="px-3 py-2 text-ananael-gold">
                  {row.finalValue ?? '—'}
                </td>
                <td className="px-3 py-2 text-zinc-100">{row.roman}</td>
                <td className="px-3 py-2 text-zinc-100">{row.name}</td>
                <td className="px-3 py-2 text-zinc-300">{row.signification}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500">{MATHERS_TABLE_SOURCE}</p>
    </div>
  );
}
