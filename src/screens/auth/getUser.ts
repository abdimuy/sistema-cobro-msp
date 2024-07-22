import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import {db} from '../../firebase/connection';

export interface User {
  ID: string;
  NOMBRE: string;
  EMAIL: string;
  CREATED_AT: Timestamp;
  COBRADOR_ID: number;
  TELEFONO: string;
  FECHA_CARGA_INICIAL: Timestamp;
  ZONA_CLIENTE_ID: number;
}

const getUser = async (email: string): Promise<User> => {
  const q = query(collection(db, 'users'), where('EMAIL', '==', email));
  const docSnap = await getDocs(q);
  const user = docSnap.docs.map(doc => doc.data() as User)[0];
  return user;
};

export default getUser;
