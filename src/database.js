// src/database.js
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

let db;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabase({name: 'app.db', location: 'default'});
    await db.transaction(async tx => {
      // Таблица пользователей
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          firstName TEXT,
          lastName TEXT,
          middleName TEXT,
          email TEXT
        );`,
      );
      // Таблица маршрутов
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          number_route TEXT,
          date TEXT,
          quantity_orders INTEGER,
          status TEXT,
          user_id TEXT
        );`,
      );
      // Таблица заказов (без routeId и FOREIGN KEY)
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          address TEXT,
          clientFio TEXT,
          qr TEXT,
          number_act TEXT,
          phone TEXT,          -- Храним как JSON-строку
          items TEXT,          -- Храним продукты как JSON-строку
          createdAt INTEGER,
          dateStart INTEGER,
          dateEnd INTEGER,
          status TEXT,
          updatedAt INTEGER,
          user_id TEXT
        );`,
      );
      // Таблица отложенных запросов (без изменений)
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pending_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productId TEXT,
          orderId TEXT,
          qr TEXT,
          dataMatrix TEXT,
          status TEXT,           -- pending, sent, failed
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
      );
    });
    console.log('Database and tables created successfully');

    // 👇 здесь теперь безопасно выполнять SELECT
    db.transaction(tx => {
      tx.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table';",
        [],
        (_, results) => {
          const tables = [];
          for (let i = 0; i < results.rows.length; i++) {
            tables.push(results.rows.item(i).name);
          }
          console.log('Существующие таблицы в БД:', tables);
        },
        (_, error) => {
          console.error('Ошибка при получении таблиц:', error);
          return false;
        },
      );
    });
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export const getDB = () => db;
