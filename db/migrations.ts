import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Garante que a tabela de tarefas exista antes de acessar os dados
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS todos (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      'title TEXT NOT NULL,' +
      'completed INTEGER NOT NULL DEFAULT 0,' +
      'due_date TEXT,' +
      'created_at TEXT NOT NULL' +
      ')'
  );
}
