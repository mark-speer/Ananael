import AuthForms from './AuthForms';
import AnanaelWordmark from './AnanaelWordmark';
import { SPLASH_FEATURES, SPLASH_MISSION } from '../data/splashFeatures';

interface SplashPageProps {
  onEnterGuest: () => void;
}

/**
 * Marketing splash for logged-out visitors: brand, mission, feature copy, and auth CTA.
 */
export default function SplashPage({ onEnterGuest }: SplashPageProps) {
  const scrollToAuth = () => {
    document.getElementById('splash-auth')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124, 58, 237, 0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 40%, rgba(201, 162, 39, 0.1), transparent 50%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(91, 33, 182, 0.15), transparent 45%)',
        }}
      />

      {/* Hero */}
      <header className="relative flex min-h-screen flex-col justify-center px-4 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_minmax(0,22rem)] lg:gap-16">
          <div className="splash-fade-up">
            <p className="font-display text-sm uppercase tracking-[0.35em] text-ananael-gold/80">
              Inner Sanctum
            </p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-ananael-gold sm:text-6xl lg:text-7xl">
              <AnanaelWordmark />
            </h1>
            <p className="mt-6 max-w-xl font-display text-xl text-zinc-100 sm:text-2xl">
              {SPLASH_MISSION.headline}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ananael-muted sm:text-lg">
              {SPLASH_MISSION.support}
            </p>
          </div>

          <div
            id="splash-auth"
            className="splash-fade-up splash-fade-up-delay w-full rounded-lg border border-ananael-border/80 bg-ananael-panel p-5 shadow-glow sm:p-6"
          >
            <h2 className="font-display text-lg text-ananael-gold">
              Sign in or create an account
            </h2>
            <p className="mt-1 mb-4 text-sm text-ananael-muted">
              Save journal entries, readings, layouts, and notes to your profile.
            </p>
            <AuthForms />
            <div className="mt-5 border-t border-ananael-border/60 pt-4 text-center">
              <button
                type="button"
                onClick={onEnterGuest}
                className="text-sm text-ananael-muted underline-offset-4 transition hover:text-ananael-gold hover:underline"
              >
                Continue as guest
              </button>
              <p className="mt-2 text-xs text-ananael-muted/80">
                Explore calculators and divination without an account. Persistence
                features require sign-in.
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="splash-breathe pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-ananael-gold/40 sm:block"
        >
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
            <path
              d="M10 4v16M4 14l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </header>

      {/* Mission */}
      <section
        aria-labelledby="splash-mission-heading"
        className="border-t border-ananael-border/40 px-4 py-20 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="splash-mission-heading"
            className="font-display text-2xl text-ananael-gold sm:text-3xl"
          >
            Why Ananael
          </h2>
          <p className="mt-6 text-base leading-relaxed text-zinc-300 sm:text-lg">
            {SPLASH_MISSION.body}
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        aria-labelledby="splash-features-heading"
        className="border-t border-ananael-border/40 px-4 py-20 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="splash-features-heading"
            className="font-display text-2xl text-ananael-gold sm:text-3xl"
          >
            Feature modules
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ananael-muted sm:text-base">
            Every tool lives in the same Inner Sanctum—from Magical OS to
            Solomonic Circles—so study, timing, and ritual design stay connected.
          </p>

          <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {SPLASH_FEATURES.map((feature) => (
              <li key={feature.id} className="border-t border-ananael-border/50 pt-5">
                <h3 className="font-display text-lg text-ananael-gold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ananael-muted">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-ananael-border/40 px-4 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="font-display text-2xl text-ananael-gold">
            Enter the sanctum
          </p>
          <p className="mt-3 max-w-md text-sm text-ananael-muted">
            Create a free account to keep your Magical Journal, saved layouts, and
            readings—or continue exploring as a guest.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToAuth}
              className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ananael-violet-deep"
            >
              Sign in / Create account
            </button>
            <button
              type="button"
              onClick={onEnterGuest}
              className="rounded-md border border-ananael-border px-5 py-2.5 text-sm text-zinc-300 transition hover:border-ananael-gold hover:text-ananael-gold"
            >
              Continue as guest
            </button>
          </div>
          <p className="mt-10 font-display text-sm tracking-widest text-ananael-gold/50">
            Ananael · Inner Sanctum
          </p>
        </div>
      </footer>
    </div>
  );
}
