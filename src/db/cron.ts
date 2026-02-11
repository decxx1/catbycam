import 'dotenv/config';
import pool from '../utils/db-standalone';

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares';
const ALLOWED_CASAS = ['oficial', 'blue'];

const CRON_HOURS = [9, 12, 15, 18];
const CRON_MINUTES = 30;
const TIMEZONE = 'America/Argentina/Buenos_Aires';

interface DolarApiResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

async function syncDollarRates(): Promise<void> {
  try {
    const response = await fetch(DOLAR_API_URL);

    if (!response.ok) {
      throw new Error(`DolarAPI responded with status ${response.status}`);
    }

    const data: DolarApiResponse[] = await response.json();
    const filtered = data.filter((item) => ALLOWED_CASAS.includes(item.casa));

    for (const rate of filtered) {
      await pool.execute(
        `INSERT INTO dollar_rates (casa, nombre, compra, venta, fecha_actualizacion)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre = VALUES(nombre),
           compra = VALUES(compra),
           venta = VALUES(venta),
           fecha_actualizacion = VALUES(fecha_actualizacion)`,
        [
          rate.casa,
          rate.nombre,
          rate.compra,
          rate.venta,
          new Date(rate.fechaActualizacion),
        ]
      );
    }

    console.log(`[Cron] ${filtered.length} dollar rates synced at ${getNow()}`);
  } catch (error) {
    console.error(`[Cron] Failed to sync dollar rates:`, error);
  }
}

function getNow(): string {
  return new Date().toLocaleString('es-AR', { timeZone: TIMEZONE });
}

function getNextRunMs(): number {
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const todayRuns = CRON_HOURS.map((hour) => {
    const run = new Date(nowInTz);
    run.setHours(hour, CRON_MINUTES, 0, 0);
    return run;
  });

  // Find the next run time today or tomorrow
  let nextRun = todayRuns.find((run) => run.getTime() > nowInTz.getTime());

  if (!nextRun) {
    // Next run is tomorrow at the first scheduled hour
    nextRun = new Date(nowInTz);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(CRON_HOURS[0], CRON_MINUTES, 0, 0);
  }

  const diffMs = nextRun.getTime() - nowInTz.getTime();
  return diffMs;
}

function formatMs(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

async function scheduleNext(): Promise<void> {
  const delayMs = getNextRunMs();
  console.log(`[Cron] Next dollar rate sync in ${formatMs(delayMs)} (now: ${getNow()})`);

  setTimeout(async () => {
    await syncDollarRates();
    scheduleNext();
  }, delayMs);
}

export async function startCron(): Promise<void> {
  console.log('[Cron] Dollar rate cron started');
  console.log(`[Cron] Schedule: ${CRON_HOURS.map((h) => `${h}:${CRON_MINUTES.toString().padStart(2, '0')}`).join(', ')} (${TIMEZONE})`);

  // Initial sync on startup
  await syncDollarRates();

  // Schedule recurring
  scheduleNext();
}

// Run directly
if (import.meta.main) {
  startCron();
}
