import { openDatabase } from "./database";
import API_BASE_URL from "../../config";
import { checkNetwork } from "./networkUtils";

// Функция для сохранения действия в очередь на синхронизацию
export const saveActionToSyncQueue = async (action: string, data: any) => {
  const db = await openDatabase();
  const timestamp = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO sync_queue (action, data, timestamp)
      VALUES (?, ?, ?)`,
    [action, JSON.stringify(data), timestamp]
  );
};

// Функция для попытки синхронизации данных с сервером
export const syncDataWithServer = async () => {
  const db = await openDatabase();
  const isConnected = await checkNetwork();

  if (isConnected) {
    // Получение всех действий из sync_queue
    const actions = await db.runAsync("SELECT * FROM sync_queue");

    for (const action of actions.rows) {
      try {
        // Пример отправки данных на сервер
        const response = await fetch(`${API_BASE_URL}/${action.action}`, {
          method: "POST",
          body: action.data,
        });

        if (response.ok) {
          // Если запрос успешен, удаляем действие из очереди
          await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [action.id]);
        }
      } catch (error) {
        console.error("Ошибка синхронизации данных:", error);
      }
    }
  }
};

// Функция для последовательного получения всех данных пользователя
export const fetchUserDataFromServer = async (userId: any) => {
  try {
    const db = await openDatabase();
    const isConnected = await checkNetwork();

    if (isConnected) {
      // 1. Получение пользователя по userID
      const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
      const user = await userResponse.json();

      // Вставка данных пользователя в локальную БД (если нужно сохранять пользователей)
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

      // 2. Получение маршрутов пользователя по userID
      const routesResponse = await fetch(
        `${API_BASE_URL}/users/${userId}/routes`
      );
      const routes = await routesResponse.json();

      // Вставка маршрутов в локальную БД
      for (const route of routes) {
        await db.runAsync(
          `
            INSERT INTO Routes (id, number, points, status, date, userID, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            route.id,
            route.number,
            route.points,
            route.status,
            route.date,
            route.userID,
            route.createdAt,
            route.updatedAt,
          ]
        );

        // 3. Получение заказов по routeID для каждого маршрута
        const ordersResponse = await fetch(
          `${API_BASE_URL}/routes/${route.id}/orders`
        );
        const orders = await ordersResponse.json();

        // Вставка заказов в локальную БД
        for (const order of orders) {
          await db.runAsync(
            `
              INSERT INTO Orders (id, orderNumber, client_fio, address, phoneNumbers, size, volume, quantity, sum, comment, dateStart, dateEnd, status, routeID, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              order.id,
              order.orderNumber,
              order.client_fio,
              order.address,
              order.phoneNumbers,
              order.size,
              order.volume,
              order.quantity,
              order.sum,
              order.comment,
              order.dateStart,
              order.dateEnd,
              order.status,
              route.id,
              order.createdAt,
              order.updatedAt,
            ]
          );

          // 4. Получение продуктов по orderID для каждого заказа
          const productsResponse = await fetch(
            `${API_BASE_URL}/orders/${order.id}/products`
          );
          const products = await productsResponse.json();

          // Вставка продуктов в локальную БД
          for (const product of products) {
            await db.runAsync(
              `
                INSERT INTO Products (id, productNumberDatamatrix, productName, size, volume, price, status, quantity, orderID, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                product.id,
                product.productNumberDatamatrix,
                product.productName,
                product.size,
                product.volume,
                product.price,
                product.status,
                product.quantity,
                order.id,
                product.createdAt,
                product.updatedAt,
              ]
            );
          }
        }
      }

      console.log(
        "Все данные пользователя успешно загружены и сохранены в локальной БД"
      );
    } else {
      // Если нет интернета, добавляем запрос в очередь на синхронизацию
      await saveActionToSyncQueue("users", { userId });
      console.log(
        "Нет подключения, данные добавлены в очередь на синхронизацию"
      );
    }
  } catch (error) {
    console.error("Ошибка при получении данных пользователя с сервера:", error);
  }
};
