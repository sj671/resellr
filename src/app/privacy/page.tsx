export default function PrivacyPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        We respect your privacy. This app stores only the data necessary to provide the service.
        Authentication is handled by Supabase. Marketplace connections (eBay) are read-only in
        Phase 3 and tokens are stored securely on the server. We do not sell your data.
      </p>
      <p className="text-sm text-muted-foreground">
        For questions or requests regarding your data, contact support at the email provided in the
        app settings.
      </p>
    </div>
  );
}


