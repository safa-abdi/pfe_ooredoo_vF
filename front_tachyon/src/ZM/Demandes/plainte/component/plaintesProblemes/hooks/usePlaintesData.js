import { useState, useCallback, useEffect } from 'react';
import { BASE_API_URL } from '../../../../../../config';
export const usePlaintesData = () => {
    const [problemPlaintes, setProblemPlaintes] = useState([]);
    const [lastId, setLastId] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const limit = 20;

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const fetchData = useCallback(async (cursor = null, isReset = false) => {
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                lastId: isReset ? '' : (cursor || lastId || ''),
                limit: limit.toString(),
                search: debouncedSearchTerm,
            });

            const res = await fetch(`${BASE_API_URL}/plainte/problemes?${params}`);
            if (!res.ok) throw new Error('Erreur de réseau');
            const data = await res.json();

            if (isReset || isInitialLoad) {
                setProblemPlaintes(data.data || []);
                setIsInitialLoad(false);
            } else {
                setProblemPlaintes(prev => [...prev, ...(data.data || [])]);
            }

            if (data.data?.length > 0) {
                setLastId(data.data[data.data.length - 1].crm_case);
            }

            setHasMore(data.data?.length === limit);
        } catch (err) {
            setError(err.message);
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    }, [lastId, debouncedSearchTerm, loading, isInitialLoad]);

    const handleSearch = useCallback((searchValue) => {
        const newSearchTerm = typeof searchValue === 'object' ? searchValue.target.value : searchValue;
        setSearchTerm(newSearchTerm);
    }, []);

    useEffect(() => {
        setProblemPlaintes([]);
        setLastId(null);
        setHasMore(true);
        fetchData(null, true);
    }, [debouncedSearchTerm]);

    return {
        problemPlaintes,
        loading,
        error,
        searchTerm,
        hasMore,
        isInitialLoad,
        fetchData,
        handleSearch,
        setProblemPlaintes,
        setError
    };
};