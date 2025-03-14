// services/dataSyncService.js
import API_BASE_URL from "../../../config"; // URL API

// Функция для получения и синхронизации данных
export const fetchAndSyncUserData = async (userId, db) => {
  try {
    // Получаем данные маршрутов пользователя из удаленной базы
    const routesResponse = await fetch(
      `${API_BASE_URL}/routes/connection?userID=${userId}`
    );
    const routes = await routesResponse.json();

    // Получаем все маршруты, которые есть в локальной базе данных
    const localRoutes = await db.getAllAsync(
      "SELECT id FROM Routes WHERE userID = ?",
      [userId]
    );
    const localRouteIds = localRoutes.map((route) => route.id);

    // Определяем маршруты, которые нужно удалить из локальной базы (если их нет в удаленной)
    const remoteRouteIds = routes.map((route) => route.id);
    const routesToDelete = localRouteIds.filter(
      (id) => !remoteRouteIds.includes(id)
    );

    // Удаляем маршруты, которых больше нет в удаленной базе данных
    if (routesToDelete.length > 0) {
      for (const routeId of routesToDelete) {
        await db.runAsync("DELETE FROM Routes WHERE id = ?", [routeId]);
        await db.runAsync("DELETE FROM Orders WHERE routeID = ?", [routeId]); // Удаляем связанные заказы
        await db.runAsync(
          "DELETE FROM Products WHERE orderID IN (SELECT id FROM Orders WHERE routeID = ?)",
          [routeId]
        ); // Удаляем связанные товары
      }
      console.log("Маршруты, отсутствующие в удаленной базе, были удалены.");
    }

    // Сохраняем или обновляем маршруты из удаленной базы
    for (const route of routes) {
      // Сохраняем маршрут в локальной базе данных
      await db.runAsync(
        `INSERT OR REPLACE INTO Routes (id, number,  status, date, userID, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          route.id,
          route.number,
          route.status,
          route.date,
          userId,
          new Date(),
          new Date(),
        ]
      );

      // Получаем заказы для маршрута
      const ordersResponse = await fetch(`${API_BASE_URL}/orders/${route.id}`);
      const orders = await ordersResponse.json();

      for (const order of orders) {
        // Сохраняем заказ в локальной базе данных
        await db.runAsync(
          `INSERT OR REPLACE INTO Orders (id, qrcode, client_fio, address, phoneNumbers, comment, dateStart, dateEnd, status, routeID, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            order.qrcode,
            order.client_fio,
            order.address,
            order.phoneNumbers,
            order.comment,
            order.dateStart,
            order.dateEnd,
            order.status,
            route.id,
            new Date(),
            new Date(),
          ]
        );

        // Получаем товары для заказа
        const productsResponse = await fetch(
          `${API_BASE_URL}/products/${order.id}`
        );
        const products = await productsResponse.json();

        for (const product of products) {
          // Сохраняем товар в локальной базе данных
          await db.runAsync(
            `INSERT OR REPLACE INTO Products (id, datamatrix, productName, size, volume, price, status, quantity, orderID, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.id,
              product.datamatrix,
              product.productName,
              product.size,
              product.volume,
              product.price,
              product.status,
              product.quantity,
              order.id,
              new Date(),
              new Date(),
            ]
          );
        }
      }
    }
    // Вывод данных из локальной базы данных после синхронизации
    // await fetchAndLogLocalData(db);
    console.log("Данные успешно синхронизированы в локальной базе данных.");
  } catch (error) {
    console.error("Ошибка при синхронизации данных:", error);
  }
};
// Функция для вывода данных из локальной базы данных
const fetchAndLogLocalData = async (db) => {
  try {
    // Получаем данные из таблицы Routes
    const routes = await db.getAllAsync("SELECT * FROM Routes");
    console.log("Маршруты в локальной базе данных:", routes);

    // Получаем данные из таблицы Orders
    const orders = await db.getAllAsync("SELECT * FROM Orders");
    console.log("Заказы в локальной базе данных:", orders);

    // Получаем данные из таблицы Products
    const products = await db.getAllAsync("SELECT * FROM Products");
    console.log("Товары в локальной базе данных:", products);
  } catch (error) {
    console.error("Ошибка при получении данных из локальной базы:", error);
  }
};
