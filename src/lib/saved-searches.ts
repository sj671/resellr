/**
 * Utility functions for managing saved searches and keeping results_count in sync
 */

export interface SavedSearchData {
  user_id: string;
  title?: string | null;
  query?: string | null;
  ai_query?: string | null;
  results_json: unknown;
  reference_image_url?: string | null;
  reference_image_path?: string | null;
  results_count?: number;
}

/**
 * Calculate the results count from results_json data
 * Handles both direct array and object with results property
 */
export function calculateResultsCount(resultsJson: unknown): number {
  if (!resultsJson) return 0;
  
  try {
    if (Array.isArray(resultsJson)) {
      return resultsJson.length;
    }
    
    if (typeof resultsJson === 'object' && resultsJson !== null && 'results' in resultsJson && Array.isArray((resultsJson as { results: unknown }).results)) {
      return (resultsJson as { results: unknown[] }).results.length;
    }
    
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Prepare saved search data with calculated results_count
 */
export function prepareSavedSearchData(data: Omit<SavedSearchData, 'results_count'>): SavedSearchData {
  return {
    ...data,
    results_count: calculateResultsCount(data.results_json)
  };
}

/**
 * Update saved search data and recalculate results_count
 */
export function updateSavedSearchData(existingData: SavedSearchData, updates: Partial<SavedSearchData>): SavedSearchData {
  const updatedData = { ...existingData, ...updates };
  
  // If results_json was updated, recalculate results_count
  if (updates.results_json !== undefined) {
    updatedData.results_count = calculateResultsCount(updates.results_json);
  }
  
  return updatedData;
}
