import { Link } from "react-router-dom";
import logoVideo from "../../assets/logo/logo-animation.mp4";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#eef0ff] via-[#f6edff] to-[#ffffff]">
      {/* background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lime-200/25 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(79,70,229,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,70,229,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* NAV */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
          <Link to="/" className="flex items-center">
            <video
              src={logoVideo}
              autoPlay
              loop
              muted
              playsInline
              className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-2xl object-cover shadow-md transition-transform duration-300 hover:scale-105"
            />
          </Link>

          <Link
            to="/admin-login"
            className="rounded-full border border-red-300/70 bg-white/50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-white transition"
          >
            Admin Login
          </Link>
        </header>

        {/* HERO */}
        <section className="pt-6 sm:pt-8 md:pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              Smarter tracking • Clear goals • Better decisions
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-indigo-950 leading-tight">
              Personalized Wealth Management
              <span className="text-indigo-600"> &amp; Goal Tracker</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Track spending, plan goals, and understand your finances with a
              clean dashboard built for clarity—not confusion.
            </p>

            {/* ACTION BUTTONS */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center rounded-full bg-lime-600 px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-lime-600/20 hover:bg-lime-700 transition"
              >
                Get Started
                <span className="ml-2 transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm sm:text-base font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 transition"
              >
                Create Account
              </Link>
            </div>

            {/* trust row */}
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Secure by design
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Goal-based insights
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Simple, fast UI
              </span>
            </div>
          </div>

          {/* FEATURES */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              title="Goal Tracking"
              desc="Set targets, track progress, and stay consistent with milestone insights."
              icon="🎯"
            />
            <FeatureCard
              title="Smart Categorization"
              desc="Understand where your money goes with clean breakdowns & trends."
              icon="📊"
            />
            <FeatureCard
              title="Personalized Insights"
              desc="Get tailored suggestions based on your habits and goals."
              icon="✨"
            />
          </div>

          {/* INFO */}
          <div className="mt-10 mb-16">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-xl ring-1 ring-indigo-100 p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-xl sm:text-2xl font-bold text-indigo-950">
                    Our approach to personalization
                  </h2>

                  <p className="mt-3 text-slate-700 text-sm sm:text-base">
                    We focus on clean data, transparent insights, and goal-first
                    experiences to keep your money decisions simple.
                  </p>

                  <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                    A platform-based approach helps scale personalization while
                    keeping the experience fast, secure, and easy to understand.
                  </p>
                </div>

                <div className="md:w-72">
                  <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700">
                      Quick Start
                    </p>
                    <ol className="mt-2 space-y-2 text-sm text-slate-700">
                      <li className="flex gap-2">
                        <span className="font-semibold text-indigo-700">1.</span>
                        User Signup
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-indigo-700">2.</span>
                        Create goals
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-indigo-700">3.</span>
                        Track & improve
                      </li>
                    </ol>
                  </div>

                  <div className="mt-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <p className="text-xs font-semibold text-red-700">
                      Admin Access
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Manage platform settings from the admin dashboard.
                    </p>
                    <Link
                      to="/admin-login"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                    >
                      Admin Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} WealthTrack • Built with focus on clarity
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-indigo-100 p-6 hover:-translate-y-0.5 hover:shadow-xl transition">
      <div className="flex items-center justify-between">
        <div className="text-2xl">{icon}</div>
        <div className="h-10 w-10 rounded-2xl bg-indigo-600/10 ring-1 ring-indigo-100" />
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-bold text-indigo-950">
        {title}
      </h3>
      <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
