import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../api/config';

/**
 * Shared hook — fetches the distinct college list from the backend once
 * and returns it as a sorted array of strings.
 */
export function useColleges() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.COLLEGES_LIST)
      .then(res => res.json())
      .then(data => {
        setColleges(data.colleges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { colleges, loading };
}
