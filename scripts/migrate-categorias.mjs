/**
 * One-time migration: update existing user categories from the old
 * Simples/Completo system to the new Consulta/Administrador system.
 *
 * Setup:
 *   1. Download your service account key from Firebase Console →
 *      Project Settings → Service accounts → Generate new private key
 *   2. Save it as scripts/serviceAccount.json
 *   3. Run: node scripts/migrate-categorias.mjs
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const require = createRequire(import.meta.url)
const admin = require('firebase-admin')

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, 'serviceAccount.json'), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

const MIGRATION_MAP = {
  Simples: 'Consulta',
  Completo: 'Administrador',
}

async function migrate() {
  console.log('Fetching usuarios...')
  const snap = await db.collection('usuarios').get()

  let updated = 0
  let skipped = 0

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const oldCategoria = data.categoria
    const newCategoria = MIGRATION_MAP[oldCategoria]

    if (newCategoria) {
      await db.collection('usuarios').doc(docSnap.id).update({ categoria: newCategoria })
      console.log(`  ✓ ${data.nome || data.email} — ${oldCategoria} → ${newCategoria}`)
      updated++
    } else {
      console.log(`  – ${data.nome || data.email} — "${oldCategoria}" (no change needed)`)
      skipped++
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
