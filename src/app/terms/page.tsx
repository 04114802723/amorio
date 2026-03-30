import { Navbar, Footer } from "@/components/shared";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <div className="prose prose-invert prose-lg">
            <p className="text-dark-300 mb-6">Last updated: March 2026</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Welcome to AMORIO</h2>
              <p className="text-dark-300">
                By using AMORIO, you agree to these terms. We've kept them simple and human-readable 
                because we believe you shouldn't need a lawyer to use an app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">The Service</h2>
              <p className="text-dark-300">
                AMORIO is a free video chat platform designed to help people make genuine friendships 
                through random video calls. We provide the technology; you bring the conversation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Be a Good Human</h2>
              <p className="text-dark-300 mb-4">When using AMORIO, you agree to:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Treat others with respect and kindness</li>
                <li>Be at least 18 years old</li>
                <li>Not share inappropriate, harmful, or illegal content</li>
                <li>Not harass, threaten, or bully other users</li>
                <li>Not impersonate others or create fake accounts</li>
                <li>Not use the platform for commercial purposes or spam</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Account</h2>
              <p className="text-dark-300">
                You're responsible for keeping your account secure. If you notice any unauthorized 
                access, let us know immediately. We reserve the right to suspend accounts that 
                violate these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Content</h2>
              <p className="text-dark-300">
                You retain ownership of any content you share. By using AMORIO, you grant us 
                permission to transmit your video/audio during calls (that's how the app works). 
                We don't store or record your calls.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Free Forever</h2>
              <p className="text-dark-300">
                AMORIO is free to use. No premium tiers, no hidden fees. We may introduce optional 
                features in the future, but the core experience will always be free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
              <p className="text-dark-300">
                AMORIO is provided "as is." We do our best to keep things running smoothly, but 
                we can't guarantee 100% uptime or that you'll make your new best friend on the 
                first call (though we hope you do!).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
              <p className="text-dark-300">
                Reach out at legal@amorio.app — we're happy to clarify anything.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
