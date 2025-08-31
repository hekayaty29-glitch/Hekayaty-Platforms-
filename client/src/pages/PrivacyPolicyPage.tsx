import { Helmet } from "react-helmet";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy – Hekayaty</title>
        <meta name="description" content="Learn how Hekayaty collects, uses, and protects your data." />
      </Helmet>

      <div className="min-h-[calc(100vh-200px)] py-12 px-4 text-amber-50" style={{ backgroundColor: '#151008' }}>
        <div className="container mx-auto max-w-3xl space-y-8">
          <h1 className="font-cinzel text-3xl font-bold text-center mb-6 text-amber-400">
            🔒 ثانيًا: سياسة الخصوصية (Privacy Policy)
          </h1>

          <p className="text-sm text-center italic mb-4">Last Updated: June 12, 2025</p>

          <section className="space-y-4 leading-relaxed font-cormorant">
            <p>
              We at <span className="text-amber-400">Hekayaty</span> are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your data.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">1. Information We Collect</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Account info (email, username, password)</li>
              <li>Profile details (bio, preferences)</li>
              <li>Content you create or interact with</li>
              <li>Payment info (if subscribing to VIP)</li>
              <li>Cookies and usage data</li>
            </ul>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>To provide and personalize our service</li>
              <li>To process transactions</li>
              <li>To communicate with you</li>
              <li>To improve our features and content</li>
            </ul>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">3. Sharing Your Data</h2>
            <p>
              We do not sell your data. We may share it with:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Trusted third parties (e.g., payment processors)</li>
              <li>Legal authorities if required</li>
            </ul>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">4. Data Security</h2>
            <p>
              We use encryption, firewalls, and security practices to protect your data. However, no method is 100% secure.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">5. Your Rights</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access and edit your data</li>
              <li>Request deletion of your account</li>
              <li>Opt out of email communications</li>
            </ul>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">6. Children's Privacy</h2>
            <p>We do not knowingly collect data from children under 13.</p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">7. Cookies</h2>
            <p>
              We use cookies to enhance user experience and analyze site traffic. You can manage cookies through your browser settings.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">8. International Users</h2>
            <p>
              Your data may be stored or processed outside your country. By using our service, you consent to this transfer.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">9. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of major changes.
            </p>

            <h2 className="font-cinzel text-lg font-bold text-amber-400">10. Contact</h2>
            <p>
              For questions or concerns: <a href="mailto:privacy@hekayaty.com" className="underline text-amber-400">privacy@hekayaty.com</a>
            </p>
          </section>

          <div className="text-center mt-10">
            <Link href="/terms" className="text-amber-500 hover:text-amber-400 font-cinzel">
              Read our Terms of Use →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
