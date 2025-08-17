import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import StatCard from "./_components/StatCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // const displayName = profile?.display_name ?? profile?.email ?? user.email ?? "User";

  // Debug logging for user and profile
  console.log('Dashboard: User data:', { id: user.id, email: user.email });
  console.log('Dashboard: Profile data:', profile);

  // Fetch saved searches data
  const { data: savedSearches, error: searchError } = await supabase
    .from("saved_searches")
    .select("id,title,query,reference_image_url,created_at,results_json,results_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Debug logging
  console.log('Dashboard: User ID:', user.id);
  console.log('Dashboard: Saved searches query result:', { savedSearches, searchError });
  console.log('Dashboard: Total searches found:', savedSearches?.length ?? 0);
  
  // Debug the results calculation
  if (savedSearches && savedSearches.length > 0) {
    const firstSearch = savedSearches[0];
    console.log('Dashboard: First search results_count:', firstSearch.results_count);
    console.log('Dashboard: First search results_json type:', typeof firstSearch.results_json);
    if (firstSearch.results_json) {
      const data = firstSearch.results_json;
      console.log('Dashboard: JSON structure:', {
        isArray: Array.isArray(data),
        hasResults: data.results && Array.isArray(data.results),
        resultsLength: data.results ? data.results.length : 'N/A'
      });
    }
  }

  const totalSearches = savedSearches?.length ?? 0;
  const recentSearches = savedSearches?.slice(0, 5) ?? [];
  
  // Use cached results_count for better performance
  const searchesWithResults = savedSearches?.filter(s => (s.results_count || 0) > 0).length ?? 0;
  const totalResults = savedSearches?.reduce((sum, s) => sum + (s.results_count || 0), 0) ?? 0;

  // Get search statistics
  const searchQueries = savedSearches?.map(s => s.query).filter(Boolean) ?? [];
  const uniqueQueries = [...new Set(searchQueries)];
  const mostCommonQuery = searchQueries.length > 0 
    ? searchQueries.reduce((a, b) => 
        searchQueries.filter(v => v === a).length >= searchQueries.filter(v => v === b).length ? a : b
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Search Dashboard</h1>
        <Link 
          href="/search" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Search
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Searches" 
          value={totalSearches} 
          sublabel="Saved search queries" 
        />
        <StatCard 
          label="Active Searches" 
          value={searchesWithResults} 
          sublabel="With results found" 
        />
        <StatCard 
          label="Total Results" 
          value={totalResults.toLocaleString()} 
          sublabel="Items discovered" 
        />
        <StatCard 
          label="Unique Queries" 
          value={uniqueQueries.length} 
          sublabel="Different search terms" 
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Searches</h2>
          <Link 
            href="/search/saved" 
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All
          </Link>
        </div>
        
        {recentSearches.length > 0 ? (
          <div className="grid gap-3">
            {recentSearches.map((search) => (
              <div key={search.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{search.title || "Untitled Search"}</h3>
                      {search.results_count && search.results_count > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {search.results_count} results
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {search.query || "Image search"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(search.created_at as string).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/search/results?search=${search.id}`}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      View Results
                    </Link>
                    <Link
                      href={`/search/saved`}
                      className="px-3 py-1 text-sm border rounded hover:bg-accent transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">No saved searches yet</p>
              <p className="text-sm">Start searching items to save your first search</p>
            </div>
            <Link 
              href="/search" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Searching
            </Link>
          </div>
        )}
      </div>

      {mostCommonQuery && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Search Insights</h2>
          <div className="border rounded-lg p-4 bg-accent/30">
            <p className="text-sm text-muted-foreground mb-2">Most searched term:</p>
            <p className="font-medium">&ldquo;{mostCommonQuery}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1">
              This term appears in {searchQueries.filter(q => q === mostCommonQuery).length} searches
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


