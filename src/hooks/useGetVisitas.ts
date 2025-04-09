import getVisitasLocal from '../services/getVisitasLocal';
import {useState, useEffect} from 'react';
import {VisitaLocal} from '../services/sendVisita';

const useGetVisitas = (initDate: string = '') => {
  const [visitas, setVisitas] = useState<VisitaLocal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getVisitas = (initDate: string) => {
    setLoading(true);
    getVisitasLocal(initDate)
      .then(visitas => {
        setVisitas(visitas);
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getVisitas(initDate);
  }, [initDate]);

  return {visitas, loading};
};

export default useGetVisitas;
