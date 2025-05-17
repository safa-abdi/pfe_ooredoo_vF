import { useEffect, useState } from 'react';

export const useSttProgressCounts = (matchingSTTs) => {
  const [sttProgressCounts, setSttProgressCounts] = useState({});

  useEffect(() => {
    const loadSttProgressCounts = async () => {
      const counts = {};
      for (const stt of matchingSTTs) {
        try {
          const response = await fetch(
            `http://localhost:3000/activation/stt/${stt.companyId || stt.id}/in-progress-count`
          );
          if (response.ok) {
            const data = await response.json();
            counts[stt.id] = data.count;
          }
        } catch (error) {
          console.error('Error loading STT progress count:', error);
        }
      }
      setSttProgressCounts(counts);
    };

    if (matchingSTTs.length > 0) {
      loadSttProgressCounts();
    }
  }, [matchingSTTs]);

  return sttProgressCounts;
};
