import 'dotenv/config';
import pool from '../../utils/db-standalone';

// Province codes match Correo Argentino MiCorreo API letter codes
const provinces: { name: string; code: string }[] = [
  { name: 'BUENOS AIRES',          code: 'B' },
  { name: 'CATAMARCA',             code: 'K' },
  { name: 'CHACO',                 code: 'H' },
  { name: 'CHUBUT',                code: 'U' },
  { name: 'CIUDAD DE BUENOS AIRES', code: 'C' },
  { name: 'CÓRDOBA',               code: 'X' },
  { name: 'CORRIENTES',            code: 'W' },
  { name: 'ENTRE RÍOS',            code: 'E' },
  { name: 'FORMOSA',               code: 'P' },
  { name: 'JUJUY',                 code: 'Y' },
  { name: 'LA PAMPA',              code: 'L' },
  { name: 'LA RIOJA',              code: 'F' },
  { name: 'MENDOZA',               code: 'M' },
  { name: 'MISIONES',              code: 'N' },
  { name: 'NEUQUÉN',               code: 'Q' },
  { name: 'RÍO NEGRO',             code: 'R' },
  { name: 'SALTA',                 code: 'A' },
  { name: 'SAN JUAN',              code: 'J' },
  { name: 'SAN LUIS',              code: 'D' },
  { name: 'SANTA CRUZ',            code: 'Z' },
  { name: 'SANTA FE',              code: 'S' },
  { name: 'SANTIAGO DEL ESTERO',   code: 'G' },
  { name: 'TIERRA DEL FUEGO',      code: 'V' },
  { name: 'TUCUMÁN',               code: 'T' },
];

export async function seed() {
  console.log('Seeding provinces...');

  for (const { name, code } of provinces) {
    await pool.execute(
      `INSERT INTO provinces (name, code) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code)`,
      [name, code]
    );
  }

  console.log(`✓ ${provinces.length} provinces seeded`);
}

if (import.meta.main) {
  seed().then(() => pool.end());
}
