import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [isLoggedIn] = useState(() => Boolean(localStorage.getItem('token')))
  const [activeTab, setActiveTab] = useState('habits') // 'habits' | 'tasks' | 'notes' | 'social'

  useEffect(() => {
    document.title = 'DailyTrack — Habit Tracker & Daily Task Planner'
  }, [])

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent/20">
      {/* Editorial Navigation Bar */}
      <header className="border-b border-line bg-raised sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xs bg-ink text-paper font-display text-base font-bold transition-transform group-hover:scale-105">
              DT
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider text-accent uppercase block leading-none">
                DailyTrack
              </span>
              <span className="font-display text-sm font-semibold text-ink leading-tight">
                Habits &amp; Daily Tasks
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main Navigation">
            <a
              href="#features"
              className="hidden sm:inline-block text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:inline-block text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="hidden md:inline-block text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              FAQ
            </a>

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs transition-colors hover:bg-ink/90"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-ink transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover"
                >
                  Start Free &rarr;
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        {/* HERO SECTION */}
        <section className="border-b border-line px-4 py-16 sm:py-24 text-center bg-paper">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 border border-line bg-raised px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
              Two Systems, One Focused Workflow
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.15]">
              DailyTrack — Habit Tracker &amp; Daily Task Planner
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
              Most productivity apps confuse <strong>recurring habits</strong> with <strong>single-day tasks</strong>.
              DailyTrack keeps them cleanly separated: maintain ongoing habit streaks, organize today&rsquo;s actionable priorities, write private reflections, and stay accountable with friends.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/signup"
                className="bg-accent px-6 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-accent-hover hover:scale-102"
              >
                Start Tracking Free &rarr;
              </Link>
              <a
                href="#features"
                className="border border-line bg-raised px-6 py-3 text-sm font-semibold text-ink shadow-2xs transition-colors hover:border-ink hover:bg-paper"
              >
                Explore Features &darr;
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="text-good font-bold">✓</span> Free to use
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-good font-bold">✓</span> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-good font-bold">✓</span> Zero data selling
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-good font-bold">✓</span> Fast &amp; responsive
              </span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE FEATURE SHOWCASE */}
        <section id="features" className="border-b border-line px-4 py-16 bg-raised/40">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Built Around How High Performers Actually Work
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
                Explore the four distinct core modules engineered for daily clarity and sustained consistency.
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="flex flex-wrap justify-center gap-2 border-b border-line pb-4" role="tablist">
              {[
                { id: 'habits', label: '1. Recurring Habits', icon: '🔥' },
                { id: 'tasks', label: '2. Daily Tasks', icon: '📋' },
                { id: 'notes', label: '3. Daily Journal', icon: '📝' },
                { id: 'social', label: '4. Social Accountability', icon: '🤝' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xs transition-colors border ${
                    activeTab === tab.id
                      ? 'border-ink bg-ink text-paper shadow-xs'
                      : 'border-line bg-paper text-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Habits Demo */}
            {activeTab === 'habits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border border-line bg-raised p-6 sm:p-8 shadow-xs">
                <div className="space-y-4">
                  <span className="inline-block border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent uppercase">
                    Sustainable Momentum
                  </span>
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Habits that don&rsquo;t break on a single missed day
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Recurring habits represent routines you cultivate over months—like reading 20 pages, exercising, or practicing DSA.
                  </p>
                  <ul className="space-y-2 text-xs text-ink">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>70% Daily Goal Rule:</strong> Achieve $\ge 70\%$ completion to keep your streak burning without all-or-nothing burnout.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>30-Day Activity Heatmap:</strong> Inspect monthly consistency at a glance with color-coded day intensity.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>Category Tagging:</strong> Organize routines by Health, Focus, Fitness, and Routine.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link to="/signup" className="text-xs font-semibold text-accent hover:underline">
                      Create your habit checklist &rarr;
                    </Link>
                  </div>
                </div>

                {/* Interactive UI Demonstration */}
                <div className="border border-line bg-paper p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-semibold text-muted uppercase">Today&rsquo;s Habits</span>
                    <span className="text-xs font-bold text-good">🔥 14-Day Streak</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: 'Morning meditation & breathwork', cat: 'Health', done: true },
                      { title: 'Solve 2 DSA problems', cat: 'Learning', done: true },
                      { title: '30-minute workout or brisk walk', cat: 'Fitness', done: true },
                      { title: 'Read 20 pages of non-fiction', cat: 'Learning', done: false },
                    ].map((h) => (
                      <div
                        key={h.title}
                        className="flex items-center justify-between border border-line/60 bg-raised px-3 py-2 text-xs rounded-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-4 w-4 rounded-xs border flex items-center justify-center ${h.done ? 'bg-good border-good text-white' : 'border-ink/50 bg-paper'}`}>
                            {h.done && '✓'}
                          </span>
                          <span className={h.done ? 'line-through text-muted' : 'font-medium text-ink'}>
                            {h.title}
                          </span>
                        </div>
                        <span className="border border-line bg-paper px-1.5 py-0.2 text-[10px] text-muted uppercase">
                          {h.cat}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between text-[11px] text-muted">
                    <span>Goal: 75% completed</span>
                    <span className="text-good font-semibold">Streak maintained</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Daily Tasks Demo */}
            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border border-line bg-raised p-6 sm:p-8 shadow-xs">
                <div className="space-y-4">
                  <span className="inline-block border border-bad/30 bg-bad/10 px-2 py-0.5 text-[11px] font-semibold text-bad uppercase">
                    Zero-Overload Focus
                  </span>
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Single-day tasks that never clutter tomorrow
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Daily tasks are specific, calendar-bound commitments for today—like finishing problem sets, reviewing pull requests, or studying for exams.
                  </p>
                  <ul className="space-y-2 text-xs text-ink">
                    <li className="flex items-start gap-2">
                      <span className="text-bad font-bold mt-0.5">•</span>
                      <span><strong>No Silent Rollover:</strong> Yesterday&rsquo;s tasks remain in yesterday&rsquo;s history for accurate review. They never pile up silently.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-bad font-bold mt-0.5">•</span>
                      <span><strong>Priority Tiers:</strong> Label tasks High, Medium, or Low priority to tackle high-stakes items first.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-bad font-bold mt-0.5">•</span>
                      <span><strong>Intentional Carry-Forward:</strong> Choose deliberately whether an unfinished task deserves tomorrow&rsquo;s focus.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link to="/signup" className="text-xs font-semibold text-accent hover:underline">
                      Organize today&rsquo;s priorities &rarr;
                    </Link>
                  </div>
                </div>

                <div className="border border-line bg-paper p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-semibold text-muted uppercase">Today&rsquo;s Actionable Objectives</span>
                    <span className="text-xs text-muted">Oct 26</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: 'Submit Digital Logic lab report', prio: 'High', color: 'bg-bad/10 text-bad border-bad/30', done: true },
                      { title: 'Prepare presentation slides for demo', prio: 'High', color: 'bg-bad/10 text-bad border-bad/30', done: false },
                      { title: 'Review pull request #14 on repo', prio: 'Medium', color: 'bg-warn/10 text-warn border-warn/30', done: false },
                    ].map((t) => (
                      <div
                        key={t.title}
                        className="flex items-center justify-between border border-line/60 bg-raised px-3 py-2 text-xs rounded-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-4 w-4 rounded-xs border flex items-center justify-center ${t.done ? 'bg-good border-good text-white' : 'border-ink/50 bg-paper'}`}>
                            {t.done && '✓'}
                          </span>
                          <span className={t.done ? 'line-through text-muted' : 'font-medium text-ink'}>
                            {t.title}
                          </span>
                        </div>
                        <span className={`border px-1.5 py-0.2 text-[10px] font-semibold uppercase ${t.color}`}>
                          {t.prio}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-line pt-2 text-[11px] text-muted text-center">
                    Tasks stay anchored to Oct 26 for historical clarity.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Daily Journal Demo */}
            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border border-line bg-raised p-6 sm:p-8 shadow-xs">
                <div className="space-y-4">
                  <span className="inline-block border border-good/30 bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good uppercase">
                    Reflective Journaling
                  </span>
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Private daily notes with background autosave
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    End every day with objective reflections. Write what went well, what blockers occurred, and what you learned.
                  </p>
                  <ul className="space-y-2 text-xs text-ink">
                    <li className="flex items-start gap-2">
                      <span className="text-good font-bold mt-0.5">•</span>
                      <span><strong>Debounced Autosave:</strong> Type freely without hitting Save. Edits automatically sync to your private record.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-good font-bold mt-0.5">•</span>
                      <span><strong>Date-Anchored History:</strong> Flip back to any previous day to re-read your exact thoughts and breakthroughs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-good font-bold mt-0.5">•</span>
                      <span><strong>Private to You:</strong> Daily notes are strictly owner-only and never exposed to partners or search engines.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link to="/signup" className="text-xs font-semibold text-accent hover:underline">
                      Start your daily journal &rarr;
                    </Link>
                  </div>
                </div>

                <div className="border border-line bg-paper p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-semibold text-muted uppercase">Journal Entry</span>
                    <span className="text-xs text-good font-medium">✓ Saved at 8:42 PM</span>
                  </div>
                  <div className="border border-line bg-raised p-3 text-xs text-ink leading-relaxed font-sans italic">
                    &ldquo;Tackled the hardest calculus proof before lunch. Deep focus for 90 minutes made a massive difference. Need to get to bed 30 minutes earlier tonight.&rdquo;
                  </div>
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>154 / 10,000 characters</span>
                    <span>🔒 Private entry</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Social Accountability Demo */}
            {activeTab === 'social' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border border-line bg-raised p-6 sm:p-8 shadow-xs">
                <div className="space-y-4">
                  <span className="inline-block border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent uppercase">
                    Social Accountability
                  </span>
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Partner with friends to keep commitments real
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Accountability increases completion rates dramatically. Connect with friends and challenge each other to daily goals.
                  </p>
                  <ul className="space-y-2 text-xs text-ink">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>Send Task Challenges:</strong> Dispatch tasks directly to connected study partners or gym buddies.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>Live Progress Tracker:</strong> See when friends mark shared tasks complete in real-time.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span><strong>Safe Isolation:</strong> Friends only see tasks you explicitly share. Your personal daily notes and private checklist remain private.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link to="/signup" className="text-xs font-semibold text-accent hover:underline">
                      Find an accountability partner &rarr;
                    </Link>
                  </div>
                </div>

                <div className="border border-line bg-paper p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-semibold text-muted uppercase">Shared Challenge</span>
                    <span className="text-xs font-bold text-good">100% Completed</span>
                  </div>
                  <div className="space-y-2">
                    <div className="border border-line bg-raised p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center font-medium text-ink">
                        <span>Read 30 minutes before bed</span>
                        <span className="text-good font-bold">2/2 done</span>
                      </div>
                      <div className="h-1.5 w-full bg-paper-2 rounded-full overflow-hidden">
                        <div className="h-full bg-good w-full rounded-full" />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted pt-1">
                        <span>You: Done</span>
                        <span>@alex: Done</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-[11px] text-muted">
                    🤝 Stay motivated together without social media distractions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* WHO BENEFITS SECTION */}
        <section id="how-it-works" className="border-b border-line px-4 py-16 bg-paper">
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Who DailyTrack Is Designed For
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
                Purpose-built for individuals striving for deliberate, daily consistency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="border border-line bg-raised p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-ink text-paper font-display text-lg font-bold">
                  🎓
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Students &amp; Academics</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Balance recurring study routines (like language drills or flashcards) alongside one-day assignment deadlines without getting overwhelmed by a chaotic to-do backlog.
                </p>
              </article>

              <article className="border border-line bg-raised p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-ink text-paper font-display text-lg font-bold">
                  💻
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Software Engineers &amp; Builders</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Protect daily habits like deep focus work, technical reading, and open source contributions while tackling daily sprint tickets and bug fixes with clear priority tiers.
                </p>
              </article>

              <article className="border border-line bg-raised p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-ink text-paper font-display text-lg font-bold">
                  🌱
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Habit Builders &amp; Partners</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Anyone who wants to break bad patterns, maintain physical health routines, reflect honestly at night, and exchange accountability challenges with trusted friends.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* WHY DAILYTRACK COMPARISON TABLE */}
        <section id="why-it-works" className="border-b border-line px-4 py-16 bg-raised/30">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Why DailyTrack Outperforms Generic To-Do Apps
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
                Comparing standard productivity apps with DailyTrack&rsquo;s architectural philosophy.
              </p>
            </div>

            <div className="overflow-x-auto border border-line bg-raised shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper border-b border-line text-muted uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="p-3.5">Capability</th>
                    <th scope="col" className="p-3.5 text-accent font-bold">DailyTrack</th>
                    <th scope="col" className="p-3.5 text-muted">Typical To-Do App</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Habits vs Daily Tasks</td>
                    <td className="p-3.5 text-good font-semibold">Strictly separated systems</td>
                    <td className="p-3.5 text-muted">Mixed together in one endless list</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Unfinished Task Handling</td>
                    <td className="p-3.5 text-good font-semibold">Anchored to date; intentional rollover</td>
                    <td className="p-3.5 text-bad">Piles up indefinitely into tomorrow</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Streak Protection Rule</td>
                    <td className="p-3.5 text-good font-semibold">$\ge 70\%$ maintains momentum</td>
                    <td className="p-3.5 text-bad">1 missed item resets streak to 0</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Daily Journaling</td>
                    <td className="p-3.5 text-good font-semibold">Built-in per-date autosave journal</td>
                    <td className="p-3.5 text-muted">Requires separate note-taking app</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Partner Accountability</td>
                    <td className="p-3.5 text-good font-semibold">Send challenges &amp; track completion</td>
                    <td className="p-3.5 text-muted">Isolated solo experience</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="border-b border-line px-4 py-16 bg-paper">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Straight answers about how DailyTrack protects your data and consistency.
              </p>
            </div>

            <div className="space-y-4">
              <details className="border border-line bg-raised p-4 shadow-2xs group">
                <summary className="font-display text-sm font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                  <span>How are Habits different from Daily Tasks in DailyTrack?</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">&darr;</span>
                </summary>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Habits represent recurring routines you want to practice consistently across days (like drinking water, reading, or workouts). Daily Tasks are one-off objectives planned specifically for today (like homework or filing taxes). They have separate tracking, separate data models, and separate analytics.
                </p>
              </details>

              <details className="border border-line bg-raised p-4 shadow-2xs group">
                <summary className="font-display text-sm font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                  <span>What happens to unfinished tasks when the day ends?</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">&darr;</span>
                </summary>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Unfinished tasks remain in that specific day&rsquo;s record so your historical task analysis reflects reality. DailyTrack never silently carries uncompleted tasks into tomorrow. If an objective is still important, you can intentionally copy it to today with one click.
                </p>
              </details>

              <details className="border border-line bg-raised p-4 shadow-2xs group">
                <summary className="font-display text-sm font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                  <span>Are my daily notes and private checklist shared with friends?</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">&darr;</span>
                </summary>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  No. Daily notes and your personal task checklists are strictly private and protected by user authentication. Friends can only see challenges you explicitly send to them.
                </p>
              </details>

              <details className="border border-line bg-raised p-4 shadow-2xs group">
                <summary className="font-display text-sm font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
                  <span>Is DailyTrack completely free to use?</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">&darr;</span>
                </summary>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Yes. DailyTrack is free with no trial periods, paywalls, or hidden charges.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="px-4 py-16 sm:py-20 text-center bg-raised">
          <div className="mx-auto max-w-2xl space-y-5">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Start Building Consistent Days Today
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Join DailyTrack and bring clear focus to your daily routines, tasks, and reflections.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-block bg-accent px-8 py-3 text-sm font-semibold text-white shadow-xs transition-transform hover:bg-accent-hover hover:scale-102"
              >
                Create Your Free Account &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-paper px-4 py-8 text-xs text-muted">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink text-paper font-display text-[10px] font-bold">
              DT
            </div>
            <span className="font-semibold text-ink">DailyTrack</span>
            <span>&copy; {new Date().getFullYear()} DailyTrack. All rights reserved.</span>
          </div>

          <nav className="flex items-center gap-4" aria-label="Footer navigation">
            <Link to="/login" className="hover:text-ink transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-ink transition-colors">
              Sign Up
            </Link>
            <Link to="/dashboard" className="hover:text-ink transition-colors">
              Dashboard
            </Link>
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
