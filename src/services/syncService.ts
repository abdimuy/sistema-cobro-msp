import NetInfo from '@react-native-community/netinfo';
import {
  getEventosGarantiasPendientes,
  getImageRowsByID,
  getPendingGarantias,
  markAsUploaded,
  markAsUploadedGaranatiaEvento,
} from './garantiaService';
import {getApiConfig} from './getAPIConfig';
import RNFetchBlob from 'react-native-blob-util';
import initializeApi from './api';

export async function syncPending() {
  let current: {EXTERNAL_ID: string; DESCRIPTION: string} | null = null;

  try {
    const pendings = await getPendingGarantias();
    const api = await getApiConfig();

    for (const rec of pendings) {
      current = rec;

      // 1) Prepara los campos de texto
      const fields = [
        {name: 'externalId', data: rec.EXTERNAL_ID},
        {name: 'descripcionFalla', data: rec.DESCRIPTION},
      ];
      if (rec.OBSERVACIONES) {
        fields.push({name: 'observaciones', data: rec.OBSERVACIONES});
      }

      // 2) Consulta las imágenes locales
      const images = await getImageRowsByID(rec.EXTERNAL_ID);

      // 3) Construye el array multipart con react-native-blob-util
      const multipartData = [
        ...fields,
        // Por cada imagen, envuelve la ruta para envío binario
        ...images.map(img => ({
          name: 'imagenes',
          filename: `${img.ID}.${img.IMG_MIME?.split('/')[1]}`,
          type: img.IMG_MIME,
          data: RNFetchBlob.wrap(img.IMG_PATH || ''),
        })),
      ];

      // 4) Ejecuta la petición POST multipart
      const url = `${api}garantias/${rec.DOCTO_CC_ID}/imagenes`;
      const response = await RNFetchBlob.fetch(
        'POST',
        url,
        {'Content-Type': 'multipart/form-data'},
        multipartData,
      );

      // 5) Maneja la respuesta
      const status = response.info().status;
      if (status >= 200 && status < 300) {
        const val = response.json();
        await markAsUploaded(rec.EXTERNAL_ID);
      } else {
        console.warn('Status error:', status, await response.text());
      }
    }

    const eventosPendientes = await getEventosGarantiasPendientes();

    if (eventosPendientes.length > 0) {
      for (const evento of eventosPendientes) {
        const eventoData = {
          id: evento.ID,
          fechaEvento: evento.FECHA_EVENTO,
          comentario: evento.COMENTARIO || '',
          tipoEvento: evento.TIPO_EVENTO,
        };
        const eventoUrl = `${api}garantias/${evento.GARANTIA_ID}/eventos`;

        const apiInstance = await initializeApi();
        const eventoResponse = await apiInstance.post(eventoUrl, eventoData);

        await markAsUploadedGaranatiaEvento(evento.ID);

        if (eventoResponse.status >= 200 && eventoResponse.status < 300) {
        } else {
          console.warn(
            `⚠️ Error sincronizando evento ${evento.ID}:`,
            eventoResponse.status,
          );
        }
      }
    }
  } catch (err) {
    console.warn(`Error sincronizando garantía ${current?.EXTERNAL_ID}:`, err);
  }
}

export function setupSync() {
  // 1) Sync al iniciar
  syncPending();

  // 2) Sync cada 5 minutos aunque no cambie la conexión
  const FIVE_MIN = 5 * 60 * 1000;
  setInterval(syncPending, FIVE_MIN);

  // 3) Sync al recuperar conexión
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncPending();
    }
  });
}
