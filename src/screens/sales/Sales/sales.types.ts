import {Timestamp} from '@react-native-firebase/firestore';

export interface Sale {
  APLICADO: string;
  CALLE: string;
  CIUDAD: string;
  CLIENTE: string;
  CLIENTE_ID: number;
  LIMITE_CREDITO: number;
  NOTAS: string;
  DOCTO_CC_ACR_ID: number;
  TIEMPO_A_CORTO_PLAZOMESES: number;
  VENDEDOR_1: string;
  VENDEDOR_2: string;
  VENDEDOR_3: string;
  DOCTO_CC_ID: number;
  ENGANCHE: number;
  ESTADO: string;
  FECHA: Timestamp;
  FECHA_ULT_PAGO: Timestamp;
  FOLIO: string;
  ID: string;
  IMPORTE_PAGO_PROMEDIO: number;
  IMPTE_REST: number;
  NOMBRE_COBRADOR: string;
  NUM_IMPORTES: number;
  PARCIALIDAD: number;
  PRECIO_TOTAL: number;
  SALDO_REST: number;
  TELEFONO: string;
  TOTAL_IMPORTE: number;
  ZONA_CLIENTE_ID: number;
  ZONA_NOMBRE: string;
  ESTADO_COBRANZA: string;
  MONTO_A_CORTO_PLAZO: number;
  DIA_COBRANZA: string;
  DIA_TEMPORAL_COBRANZA: string;
}
