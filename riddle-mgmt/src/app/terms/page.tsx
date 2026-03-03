export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center sm:justify-start pt-0 sm:pt-32 pb-20 px-5 sm:px-8">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-light tracking-tight animate-fade-in">
          Terms of Service
        </h1>
        <div className="w-8 h-px bg-white/10 mt-4 mb-10 animate-fade-in" />

        <div className="space-y-6 text-sm text-white/40 font-light animate-fade-in">
          <p><strong className="text-white/60">Effective Date:</strong> March 1, 2026</p>

          <p>
            These Terms of Service govern your use of the Riddle MGMT portal operated by
            Riddle LLC at riddlellc.biz.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Use of Service</h2>
          <p>
            The Riddle MGMT portal is a private management platform provided to authorized clients and
            team members of Riddle LLC. Access is granted on an invitation basis. You agree to use the
            portal only for its intended purpose of business management and communication.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Account Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials. Notify us
            immediately if you suspect unauthorized access to your account.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Third-Party Services</h2>
          <p>
            The portal may connect to third-party services (such as accounting and cloud storage platforms)
            on your behalf. Your use of those services is subject to their respective terms. You authorize
            Riddle MGMT to access and sync data from connected services for the purpose of providing
            management services.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Limitation of Liability</h2>
          <p>
            The portal is provided &quot;as is.&quot; Riddle LLC is not liable for any indirect, incidental,
            or consequential damages arising from your use of the service.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Termination</h2>
          <p>
            We may suspend or terminate access at our discretion. You may request account termination
            at any time by contacting us.
          </p>

          <h2 className="text-xs text-white/50 tracking-[0.15em] uppercase pt-4">Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href="mailto:team@riddlellc.biz" className="text-white/50 hover:text-white transition-colors">
              team@riddlellc.biz
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
