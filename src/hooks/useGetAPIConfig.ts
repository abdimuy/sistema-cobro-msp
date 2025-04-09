import {onSnapshot, doc, Unsubscribe} from '@react-native-firebase/firestore';
import {db} from '../firebase/connection';
import {useEffect, useState} from 'react';

interface APISettings {
  baseURL: string;
}

const useGetAPIConfig = (): APISettings => {
  const [config, setConfig] = useState<APISettings>({
    baseURL: '',
  });
  const getAPIConfig = (): Unsubscribe => {
    const unsub = onSnapshot(doc(db, 'config', 'api_settings'), docConfig => {
      setConfig((docConfig.data() as APISettings) || {baseURL: ''});
    });
    return unsub;
  };

  useEffect(() => {
    const unsub = getAPIConfig();
    return unsub;
  }, []);

  return config;
};

export default useGetAPIConfig;
