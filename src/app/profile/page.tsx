"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string; last_sign_in_at?: string; created_at?: string } | null>(null);
  const [profile, setProfile] = useState<{ id: string; email: string; display_name?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    if (!showNameModal) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.name-edit-modal')) {
        setShowNameModal(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNameModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNameModal]);

  // Fetch user and profile data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Profile page: Starting data fetch...'); // Debug log
        
        // First, try the /api/me endpoint since it's server-side authenticated
        console.log('Profile page: Trying /api/me endpoint...'); // Debug log
        const response = await fetch('/api/me');
        console.log('Profile page: /api/me response status:', response.status); // Debug log
        
        if (response.ok) {
          const data = await response.json();
          console.log('Profile page: /api/me response data:', data); // Debug log
          
          if (data.user) {
            setUser(data.user);
            console.log('Profile page: User set from API:', data.user.email); // Debug log
            
            if (data.profile) {
              setProfile(data.profile);
              setDisplayName(data.profile.display_name || '');
              console.log('Profile page: Profile set from API:', data.profile); // Debug log
            }
            return; // Success, exit early
          }
        }
        
        // Fallback: try Supabase client directly
        console.log('Profile page: /api/me failed, trying Supabase client fallback...'); // Debug log
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          console.log('Profile page: User set from Supabase session:', session.user.email); // Debug log
          
          // Try to get profile data
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id,email,display_name,avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();
            
          if (profileData) {
            setProfile(profileData);
            setDisplayName(profileData.display_name || '');
            console.log('Profile page: Profile set from Supabase:', profileData); // Debug log
          }
        } else {
          console.log('Profile page: No session found - redirecting to login'); // Debug log
          window.location.href = '/login?next=/profile';
          return;
        }
      } catch (error) {
        console.error('Profile page: Failed to fetch profile data:', error);
        
        // Final fallback: try to get user directly
        try {
          console.log('Profile page: Trying final Supabase fallback...'); // Debug log
          const supabase = createSupabaseBrowserClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            setUser(authUser);
            console.log('Profile page: User set from final fallback:', authUser.email); // Debug log
          } else {
            console.log('Profile page: No user from final fallback - redirecting to login'); // Debug log
            window.location.href = '/login?next=/profile';
            return;
          }
        } catch (fallbackError) {
          console.error('Profile page: Final fallback also failed:', fallbackError);
          console.log('Profile page: All auth methods failed - redirecting to login'); // Debug log
          window.location.href = '/login?next=/profile';
          return;
        }
      } finally {
        setLoading(false);
        console.log('Profile page: Loading finished'); // Debug log
      }
    };

    fetchData();
  }, []);

  // Handle name update - commented out since setEditingName is not used
  // const handleNameUpdate = async () => {
  //   if (!displayName.trim()) return;
  //   
  //   setUpdating(true);
  //   try {
  //     const response = await fetch('/api/profile/update', {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ display_name: displayName.trim() }),
  //     });

  //     if (response.ok) {
  //       const { profile: updatedProfile } = await response.json();
  //       setProfile(updatedProfile);
  //       // setEditingName(false);
  //     } else {
  //       console.error('Failed to update profile');
  //     }
  //   } catch (error) {
  //       console.error('Error updating profile:', error);
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Debug: show what data we have
  console.log('Profile page render state:', { user, profile, loading });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No user data found. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const email = user.email ?? "";
  const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const createdAt = user.created_at ? new Date(user.created_at) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-2xl border p-6 glass-panel">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mt-3">Account Details</h2>
          <p className="text-xs text-muted-foreground">Your profile information</p>
        </div>

        <div className="space-y-4">
          <Field label="Email Address" value={email} />
          
          {/* Editable Name Field */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-3 text-sm">
              <span className={profile?.display_name ? '' : 'text-muted-foreground'}>
                {profile?.display_name || 'No name set'}
              </span>
              <button
                onClick={() => {
                  setDisplayName(profile?.display_name || '');
                  setShowNameModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-xs hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
          
          <Field label="Last Sign In" value={lastSignInAt ? formatDate(lastSignInAt.toISOString()) : "—"} />
          <Field label="Account Created" value={createdAt ? formatDate(createdAt.toISOString()) : "—"} />
          
          {/* Debug info - remove this later */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
            <p className="text-xs">User: {user ? 'Loaded' : 'Not loaded'}</p>
            <p className="text-xs">Profile: {profile ? 'Loaded' : 'Not loaded'}</p>
            <p className="text-xs">Loading: {loading ? 'Yes' : 'No'}</p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/cookies');
                  const data = await response.json();
                  console.log('Cookie debug info:', data);
                  alert(`Cookies found: ${data.authCookieCount} auth cookies, ${data.totalCookies} total cookies`);
                } catch (error) {
                  console.error('Failed to fetch cookie debug info:', error);
                }
              }}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Debug Cookies
            </button>
          </div>
        </div>

        {/* Name Edit Modal */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
            <div className="name-edit-modal w-full max-w-md mx-4 rounded-xl border bg-background shadow-lg">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Edit Name</h3>
                <button
                  onClick={() => setShowNameModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="name-input" className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    disabled={updating}
                    autoFocus
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  This name will be displayed on your profile and in the app.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!displayName.trim()) return;
                    
                    setUpdating(true);
                    try {
                      const response = await fetch('/api/profile/update', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ display_name: displayName.trim() }),
                      });

                      if (response.ok) {
                        const { profile: updatedProfile } = await response.json();
                        setProfile(updatedProfile);
                        setShowNameModal(false);
                      } else {
                        console.error('Failed to update profile');
                      }
                    } catch (error) {
                      console.error('Error updating profile:', error);
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating || !displayName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="rounded-md border bg-background/60 px-3 py-3 text-sm glass-panel">{value}</div>
    </div>
  );
}


