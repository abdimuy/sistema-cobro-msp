import {db} from '../firebase/connection';

// Función para obtener la configuración de la API desde Firestore
export async function getApiConfig(): Promise<string | null> {
  try {
    const doc = await db.collection('config').doc('api_settings').get();
    return doc.exists ? doc.data()?.baseURL : null;
  } catch (error) {
    console.error('❌ Error obteniendo configuración de API:', error);
    return null;
  }
}
