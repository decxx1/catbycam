/**
 * Formatea un valor monetario
 * @param {number} amount - Cantidad a formatear
 * @param {number} digits - Número de decimales
 * @param {string} currency - Símbolo de moneda (opcional)
 * @returns {string} - Cantidad formateada como moneda sin símbolo
 */
// eslint-disable-next-line jsdoc/require-jsdoc
export const formatMoney = (amount: number, digitsOrCurrency: number | string = 2, currencySymbol: string = '') => {
    /*
      Permite llamados con dos firmas distintas:
      1) formatMoney(amount, digits, currency)
      2) formatMoney(amount, currency)
      En el segundo caso el segundo argumento es un string con el símbolo de moneda
      y digits por defecto es 2.
    */
    let digits;
    let currency;

    if (typeof digitsOrCurrency === 'string') {
        // Se llamó como (amount, currency)
        currency = digitsOrCurrency;
        digits = 2;
    } else {
        // Se llamó como (amount, digits, currency)
        digits = digitsOrCurrency ?? 2;
        currency = currencySymbol ?? '';
    }
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }
    return `${currency}${Number(amount).toLocaleString('es-AR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;
};