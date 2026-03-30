import { Navbar, Footer } from "@/components/shared";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <div className="prose prose-invert prose-lg">
            <p className="text-dark-300 mb-6">Last updated: March 2026</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment</h2>
              <p className="text-dark-300">
                At AMORIO, privacy isn't just a policy — it's a core principle. We built this platform 
                specifically to create a safe space for authentic connections. Here's how we protect you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">What We Collect</h2>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Email address (for account creation and login)</li>
                <li>Basic profile information you choose to share</li>
                <li>Friendship connections (mutual only)</li>
                <li>Chat messages (encrypted, between friends only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">What We DON'T Collect</h2>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Video call recordings — we NEVER record your calls</li>
                <li>Your location data</li>
                <li>Contact lists or phone numbers</li>
                <li>Data from other apps or services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Zero Spam Design</h2>
              <p className="text-dark-300">
                Our architecture is built around privacy. You cannot be found by username search. 
                The only way to connect is through a mutual "Add Friend" during a live call. 
                This means no spam, no unwanted messages, no strangers in your inbox.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-dark-300">
                All data is encrypted in transit and at rest. Video calls use peer-to-peer WebRTC 
                connections — we don't route your video through our servers. Your conversations 
                stay between you and your friends.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-dark-300">
                You can delete your account and all associated data at any time. Upon deletion, 
                your profile, friendships, and messages are permanently removed from our systems.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-dark-300">
                Questions about privacy? Email us at privacy@amorio.app
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
