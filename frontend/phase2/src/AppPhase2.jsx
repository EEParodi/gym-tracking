import React from 'react';

// Minimal Phase 2 frontend skeleton: modular app shell
export default function AppPhase2() {
  return (
    <div style={{ padding: 16, fontFamily: "Barlow, sans-serif" }}>
      <h2>Phase 2 — Frontend Modularity</h2>
      <p>This is a skeleton scaffold for the future modular frontend. The real UI components will live under src/components and will be wired to the Supabase-backed data layer.</p>
      <p>Auth: placeholder login flow will eventually be swapped with a dedicated auth module (email/password via Supabase).</p>
    </div>
  );
}
