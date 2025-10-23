"use client"

export default function AnimationDebug() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Animation Debug</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* A) Tailwind built-in animate-spin */}
        <div className="p-4 rounded-lg border bg-background">
          <div className="text-sm mb-2">
            A) Tailwind <code>animate-spin</code>
          </div>
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-zinc-400 border-t-transparent animate-spin" />
        </div>

        {/* B) Your custom animate-logo (Tailwind keyframes) */}
        <div className="p-4 rounded-lg border bg-background">
          <div className="text-sm mb-2">
            B) Custom <code>animate-logo</code>
          </div>
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-zinc-400 border-t-transparent animate-logo" />
        </div>

        {/* C) Inline keyframes (Styled-JSX) — ignores Tailwind */}
        <div className="p-4 rounded-lg border bg-background">
          <div className="text-sm mb-2">C) Inline CSS (should always spin)</div>
          <div className="inline-spin mx-auto h-16 w-16 rounded-full border-4 border-zinc-400 border-t-transparent" />
          <style jsx>{`
            @keyframes inlineSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
            .inline-spin { animation: inlineSpin 8s linear infinite; display:block }
          `}</style>
        </div>
      </div>
      <p className="text-sm opacity-70">
        If A spins: Tailwind is loaded. If B doesn&apos;t spin: custom keyframes missing. If C spins but A/B don&apos;t:
        Tailwind build/config issue.
      </p>
    </div>
  )
}
