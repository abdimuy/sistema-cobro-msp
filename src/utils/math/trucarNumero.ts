/**
 * Trunca un número a una cantidad específica de decimales sin redondear.
 *
 * @param {number} numero - El número a truncar.
 * @param {number} decimales - La cantidad de decimales que se desea mantener.
 * @returns {number} El número truncado.
 */
function truncarNumero(numero: number, decimales: number) {
  const factor = Math.pow(10, decimales);
  return Math.trunc(numero * factor) / factor;
}

export default truncarNumero;
