import { Helmet } from "react-helmet";
import { Link } from "wouter";

export default function TermsOfUsePage() {
  return (
    <>
      <Helmet>
        <title>Terms of Use – Hekayaty</title>
        <meta
          name="description"
          content="Read the latest Terms of Use for Hekayaty, outlining eligibility, user content, guidelines, payments, and more."
        />
      </Helmet>

      <div className="min-h-[calc(100vh-200px)] py-12 px-4 text-amber-50" style={{ backgroundColor: '#151008' }}>
        <div className="container mx-auto max-w-3xl space-y-8">
          <h1 className="font-cinzel text-3xl font-bold text-center mb-6 text-amber-400">
            🛡️ أولًا: شروط الاستخدام (Terms of Use)
          </h1>

          <p className="text-sm text-center italic mb-4">Last Updated: June 12, 2025</p>

          <section className="space-y-4 leading-relaxed font-cormorant">
            <p>
              Welcome to <span className="text-amber-400">Hekayaty</span>. By accessing or using our
              website or services, you agree to be bound by the following Terms of Use. If you do not
              agree with any part of these terms, please do not use our services.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">1. Eligibility</h2>
            <p>You must be at least 13 years old to use Hekayaty. By using the platform, you confirm that you meet this requirement.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">2. User Content</h2>
            <p>
              You retain ownership of any content you post, upload, or publish on Hekayaty, including stories, chapters, comments, and media ("User Content"). By submitting User Content, you grant us a worldwide, royalty-free, non-exclusive license to use, distribute, modify, and display your content in connection with the platform.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">3. Content Guidelines</h2>
            <p>You agree not to post any content that is:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Illegal, abusive, defamatory, or hateful.</li>
              <li>Sexual, violent, or promotes harm to individuals or groups.</li>
              <li>Infringing on any copyright, trademark, or intellectual property.</li>
            </ul>
            <p>We reserve the right to remove any content that violates these rules.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">4. Subscriptions & Payments</h2>
            <p>If you subscribe to any premium service (e.g., VIP access), you agree to pay all associated fees. Prices may change with prior notice.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">5. Termination</h2>
            <p>We may suspend or terminate your access to Hekayaty at any time for violation of these Terms or illegal behavior.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">6. Limitation of Liability</h2>
            <p>Hekayaty is provided "as is." We make no warranties of any kind. We are not liable for any indirect or consequential damages resulting from use of our service.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">7. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the platform after changes implies your acceptance of the new terms.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">8. Contact</h2>
            <p>
              For questions about these Terms, contact us at: <a href="mailto:support@hekayaty.com" className="underline text-amber-400">support@hekayaty.com</a>
            </p>
          </section>

          <div className="text-center mt-10">
            <Link href="/privacy" className="text-amber-500 hover:text-amber-400 font-cinzel">
              Read our Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
