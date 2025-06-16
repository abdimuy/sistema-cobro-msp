import {getGarantiaBySale} from '../services/getGarantiaBySale';
import {useState, useEffect} from 'react';
import {GarantiaRecord} from '../services/garantiaService';

export function useGetGarantiaBySale(saleId: number): {
  garantia: GarantiaRecord | null;
  loading: boolean;
  error: string | null;
  fetchGarantia: () => Promise<void>;
} {
  const [garantia, setGarantia] = useState<GarantiaRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGarantia = async () => {
    try {
      setLoading(true);
      const result = await getGarantiaBySale(saleId);
      setGarantia(result);
    } catch (err) {
      console.error('Error fetching garantia:', err);
      setError('Error al obtener la garantía');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarantia();
  }, [saleId]);

  return {garantia, loading, error, fetchGarantia};
}
