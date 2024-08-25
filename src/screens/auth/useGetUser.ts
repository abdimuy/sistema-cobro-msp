import {useState, useEffect} from 'react';
import {db} from '../../firebase/connection';
import {
  collection,
  query,
  where,
  onSnapshot,
} from '@react-native-firebase/firestore';
import {USERS_COLLECTION} from '../../constants/collections';
import {User} from './getUser';

const useGetUser = (email: string, userMetadata: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userMetadata) {
      return;
    }
    const q = query(
      collection(db, USERS_COLLECTION),
      where('EMAIL', '==', email),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      if (!querySnapshot) return;
      querySnapshot.docs.forEach(doc => {
        setUser({...doc.data(), ID: doc.id} as User);
      });
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [email, userMetadata]);

  return {user, loading};
};

export default useGetUser;
