import axios from 'axios';
import {getApiConfig} from './getAPIConfig';

// URL por defecto si no se puede obtener de Firestore
const DEFAULT_BASE_URL = 'http://localhost';

let apiInstance = null;

async function initializeApi() {
  const baseURL = (await getApiConfig()) || DEFAULT_BASE_URL;

  apiInstance = axios.create({
    baseURL,
  });

  console.log(`🔗 API BASE URL: ${baseURL}`); // Para depuración

  return apiInstance;
}

export default initializeApi;
