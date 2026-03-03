import { brand } from "@/lib/brand";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center sm:justify-start pt-0 sm:pt-32 pb-20 px-5 sm:px-8">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-light tracking-tight animate-fade-in">
          Privacy Policy
        </h1>
        <div className="w-8 h-px bg-white/10 mt-4 mb-10 animate-fade-in" />

        <div className="space-y-6 text-sm text-white/40 font-light animate-fade-in">
          <p><strong className="text-white/60">Effective Date:</strong> March 1, 2026</p>

          <p>
            {brand.companyName} (&quot;{brand.portalName},&quot; &quot;we,&quot; &quot;us&quot;) operates the management portal at {brand.domain}.
            This policy describes how we collect, use, and protect your information.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Information We Collect</h2>
          <p>
            We collect information you provide when creating an account (username, display name) and data
            synced from connected third-party services such as accounting platforms and cloud storage. This
            may include financial records, documents, contact information, and transaction history.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">How We Use Your Information</h2>
          <p>
            Your information is used solely to provide management services, including financial tracking,
            document management, scheduling, and client communication through the {brand.portalName} portal.
            We do not sell, rent, or share your data with third parties for marketing purposes.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Third-Party Integrations</h2>
          <p>
            Our portal integrates with services like QuickBooks and Google Workspace. When you connect these
            services, we access your data through their official APIs using OAuth 2.0 authentication. You can
            disconnect these services at any time through the portal. Upon disconnection, we stop syncing new
            data from the disconnected service.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Data Security</h2>
          <p>
            We use industry-standard security measures including encrypted connections (HTTPS), secure token
            storage, and access controls to protect your information.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion of your
            account and associated data by contacting us.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Contact</h2>
          <p>
            For privacy-related questions, contact us at{" "}
            <a href={`mailto:${brand.email}`} className="text-white/50 hover:text-white transition-colors">
              {brand.email}
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
