import * as SQLite from "expo-sqlite";

// Функция для открытия базы данных и создания необходимых таблиц
export const openDatabase = async () => {
  const db = await SQLite.openDatabaseAsync("deliveryApp.db");

  // Установка режима WAL для повышения производительности
  await db.execAsync("PRAGMA journal_mode = WAL");

  // Создание таблиц
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        data TEXT,
        timestamp DATE
      );
    `);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstname TEXT,
        middlename TEXT,
        lastname TEXT,
        phone TEXT,
        email TEXT,
        password TEXT,
        createdAt DATE,
        updatedAt DATE
      );
    `);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT,
        status TEXT,
        date DATE,
        createdAt DATE,
        userID INTEGER,
        updatedAt DATE,
        FOREIGN KEY (userID) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
      );
    `);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qrcode TEXT,
        client_fio TEXT,
        address TEXT,
        phoneNumbers TEXT,
        comment TEXT,
        dateStart DATE,
        dateEnd DATE,
        status TEXT,
        routeID INTEGER,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY (routeID) REFERENCES Routes(id) ON UPDATE CASCADE ON DELETE SET NULL
      );
    `);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datamatrix TEXT,
        productName TEXT,
        size TEXT,
        volume TEXT,
        price FLOAT,
        status TEXT,
        quantity INTEGER,
        orderID INTEGER,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY (orderID) REFERENCES Orders(id) ON UPDATE CASCADE ON DELETE SET NULL
      );
    `);

  return db;
};

// Функция для получения данных пользователя из локальной базы данных
export const fetchUserDataFromLocalDB = async (userId: number) => {
  const db = await openDatabase();

  // Выполняем запрос к таблице Users для получения информации о пользователе
  const userResult = await db.runAsync("SELECT * FROM Users WHERE id = ?", [
    userId,
  ]);

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];
    return user; // Возвращаем данные пользователя
  } else {
    console.log("Пользователь не найден в локальной БД");
    return null;
  }
};

// Функция для вставки данных пользователя в локальную базу данных
export const insertUserDataToLocalDB = async (user: any) => {
  const db = await openDatabase();

  await db.runAsync(
    `
      INSERT INTO Users (id, firstname, middlename, lastname, phone, email, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.firstname,
      user.middlename,
      user.lastname,
      user.phone,
      user.email,
      user.password,
      user.createdAt,
      user.updatedAt,
    ]
  );
};

// Функция для удаления всех данных пользователя из локальной базы данных
export const clearUserDataFromLocalDB = async (userId: number) => {
  const db = await openDatabase();

  await db.runAsync("DELETE FROM Users WHERE id = ?", [userId]);
};
