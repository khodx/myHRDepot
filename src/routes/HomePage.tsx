import { appConfig } from '@/config/appConfig';
import { Button } from '@/components/ui/Button';
import { useMhdAuth } from '@/features/authentication/Hook';

export function HomePage() {
  const { userEmail, profile, signOut } = useMhdAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Enterprise Foundation
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {appConfig.appName}
            </h1>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>{profile?.displayName ?? userEmail}</p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-1 font-semibold text-blue-700 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
          The Task Management MVP foundation is ready for Authentication, Companies,
          People, Tasks, Notes, and Attachments packages.
        </p>
        <div className="mt-6">
          <Button type="button">Foundation Ready</Button>
        </div>
      </section>
    </main>
  );
}
