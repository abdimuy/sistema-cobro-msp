import {openDatabase} from '../sqlite/connection';
import uuid from 'react-native-uuid';

export interface GarantiaRecord {
  EXTERNAL_ID: string; // UUID local para comparación con el servidor
  DOCTO_CC_ID: number;
  DESCRIPTION: string;
  OBSERVACIONES?: string;
  UPLOADED?: number; // 0 = pendiente, 1 = sincronizado
  ESTADO: string; // 'PENDIENTE', 'CERRADA', etc.
  FECHA_SOLICITUD?: string; // Fecha de solicitud
  ID?: number; // ID local de la garantía, opcional para nuevas inserciones
}

export interface GarantiaServerResponse {
  EXTERNAL_ID: string; // UUID local para comparación con el servidor
  DOCTO_CC_ID: number;
  DESCRIPCION_FALLA: string;
  OBSERVACIONES?: string;
  ESTADO: string; // 'PENDIENTE', 'CERRADA', etc.
  ID: number; // ID del servidor
  FECHA_SOLICITUD?: string; // Fecha de solicitud
}

export interface EventoGarantia {
  ID: string;
  GARANTIA_ID: number;
  TIPO_EVENTO: string;
  FECHA_EVENTO: string;
  COMENTARIO: string | null;
  ENVIADO: number; // 0 = pendiente, 1 = enviado
}

export interface ImageRecord {
  ID: string;
  GARANTIA_ID: string; // UUID local para comparación con el servidor
  IMG_PATH: string; // Ruta local de la imagen
  IMG_MIME: string; // Tipo MIME de la imagen
  FECHA_SUBIDA: string; // Fecha de subida
}

export function saveGarantiaLocally(
  record: GarantiaRecord,
  images: ImageRecord[],
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const db = await openDatabase();
    const externalId = record.EXTERNAL_ID;

    db.transaction(
      tx => {
        // 1) Inserta la garantía
        tx.executeSql(
          `INSERT INTO garantias
             (EXTERNAL_ID, DOCTO_CC_ID, DESCRIPCION, OBSERVACIONES, UPLOADED, FECHA_SOLICITUD)
           VALUES (?, ?, ?, ?, 0, ?);`,
          [
            externalId,
            record.DOCTO_CC_ID,
            record.DESCRIPTION,
            record.OBSERVACIONES ?? '',
            record.FECHA_SOLICITUD ?? '',
          ],
          // success callback
          () => {
            // 2) Inserta cada imagen en cadena de callbacks
            insertImagesRecursive(tx, externalId, images, 0, resolve, reject);
          },
          // error callback
          (_tx, err) => {
            console.error('[SQLite][garantias] ', err.message);
            reject(err);
            return true;
          },
        );
      },
      // transaction error
      err => {
        console.error('[SQLite][TRANSACTION FAILED]', err.message);
        reject(err);
      },
      // transaction success
      () => {
        // Nota: no llamamos resolve aquí porque esperamos a que inserten las imágenes
      },
    );
  });
}

/**
 * Inserta imágenes de forma recursiva para encadenar callbacks.
 */
function insertImagesRecursive(
  tx: any,
  externalId: string,
  images: ImageRecord[],
  idx: number,
  resolve: (id: string) => void,
  reject: (err: any) => void,
) {
  if (idx >= images.length) {
    // Todas las imágenes insertadas
    return resolve(externalId);
  }

  const img = images[idx];
  tx.executeSql(
    `INSERT INTO garantia_imagenes
       (ID, GARANTIA_ID, IMG_PATH, IMG_MIME, FECHA_SUBIDA)
     VALUES (?, ?, ?, ?, ?);`,
    [uuid.v4(), externalId, img.IMG_PATH, img.IMG_MIME, img.FECHA_SUBIDA],
    // success: inserta siguiente
    () =>
      insertImagesRecursive(tx, externalId, images, idx + 1, resolve, reject),
    // error:
    (_: any, err: any) => {
      console.error('[SQLite][garantia_imagenes]', err.message, img);
      reject(err);
      return true;
    },
  );
}

/**
 * Recupera todas las garantías pendientes de sincronizar.
 */
export async function getPendingGarantias(): Promise<GarantiaRecord[]> {
  const db = await openDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM garantias WHERE UPLOADED = 0;`,
  );
  const list: GarantiaRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    list.push({
      EXTERNAL_ID: row.EXTERNAL_ID,
      DOCTO_CC_ID: row.DOCTO_CC_ID,
      DESCRIPTION: row.DESCRIPCION,
      OBSERVACIONES: row.OBSERVACIONES,
      UPLOADED: row.UPLOADED,
      ESTADO: row.ESTADO,
    });
  }
  return list;
}

export async function getEventosGarantiasPendientes(): Promise<
  EventoGarantia[]
> {
  const db = await openDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM garantia_eventos WHERE ENVIADO = 0;`,
  );
  const list: EventoGarantia[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    list.push({
      ID: row.ID,
      GARANTIA_ID: row.GARANTIA_ID,
      TIPO_EVENTO: row.TIPO_EVENTO,
      FECHA_EVENTO: row.FECHA_EVENTO,
      COMENTARIO: row.COMENTARIO,
      ENVIADO: row.ENVIADO,
    });
  }
  return list;
}

/**
 * Marca una garantía como sincronizada.
 */
export async function markAsUploaded(id: string) {
  const db = await openDatabase();
  await db.executeSql(
    `UPDATE garantias SET UPLOADED = 1 WHERE EXTERNAL_ID = ?;`,
    [id],
  );
}

export async function markAsUploadedGaranatiaEvento(id: string) {
  const db = await openDatabase();
  await db.executeSql(`UPDATE garantia_eventos SET ENVIADO = 1 WHERE ID = ?;`, [
    id,
  ]);
}

export async function actualizarEstadoGarantia(
  id: string,
  estado: string,
  comentario: string | null = null,
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        // 1) Actualiza el estado de la garantía
        tx.executeSql(
          `UPDATE garantias SET ESTADO = ? WHERE EXTERNAL_ID = ?;`,
          [estado, id],
          () => {
            // 2) Inserta el evento de entrega
            const fechaEvento = new Date().toISOString();
            const uuidEvento = uuid.v4() as string;
            tx.executeSql(
              `INSERT INTO garantia_eventos (GARANTIA_ID, TIPO_EVENTO, FECHA_EVENTO, COMENTARIO, ID)
              VALUES (?, ?, ?, ?, ?);`,
              [id, estado, fechaEvento, comentario, uuidEvento],
              () => {},
              (_tx, err) => {
                console.error('[SQLite][garantia_eventos]', err.message);
                reject(err);
                return true;
              },
            );
          },
          (_tx, err) => {
            console.error('[SQLite][garantias]', err.message);
            reject(err);
            return true;
          },
        );
      },
      err => {
        console.error('[SQLite][TRANSACTION FAILED]', err.message);
        reject(err);
      },
      () => {
        resolve();
      },
    );
  });
}

export async function getImageRowsByID(id: string) {
  const db = await openDatabase();
  const [res] = await db.executeSql(
    `SELECT * FROM garantia_imagenes WHERE GARANTIA_ID = ?;`,
    [id],
  );
  const images = res.rows.raw();
  const [all] = await db.executeSql(`SELECT * FROM garantia_imagenes;`);
  return images as ImageRecord[];
}

export async function getAllGarantias() {
  const db = await openDatabase();
  const [res] = await db.executeSql(`SELECT * FROM garantias;`);
  return res.rows.raw() as GarantiaRecord[];
}

export async function getAllEventos() {
  const db = await openDatabase();
  const [res] = await db.executeSql(`SELECT * FROM garantia_eventos;`);
  return res.rows.raw() as EventoGarantia[];
}

export async function getAllImages() {
  const db = await openDatabase();
  const [res] = await db.executeSql(`SELECT * FROM garantia_imagenes;`);
  return res.rows.raw() as ImageRecord[];
}

export async function deleteGarantiasAndImages() {
  const db = await openDatabase();
  await db.executeSql(`DELETE FROM garantias;`);
  await db.executeSql(`DELETE FROM garantia_imagenes;`);
  await db.executeSql(`DELETE FROM garantia_eventos;`);
}

export async function getNextGarantiaId(): Promise<number> {
  const db = await openDatabase();
  const [res] = await db.executeSql(
    `SELECT COALESCE(MAX(ID), 0) + 1 AS nextId FROM garantias;`,
  );
  return res.rows.item(0).nextId;
}
