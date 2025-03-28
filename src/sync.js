import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDB} from './database';
import {API_BASE_URL, API_KEY} from '../config';
import NetInfo from '@react-native-community/netinfo';

export const syncDataFromServer = async () => {
  const db = getDB();
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    console.error('User ID not found');
    return;
  }

  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    console.log('Нет интернета, синхронизация пропущена');
    return;
  }

  try {
    let routes = [];

    // 1. Синхронизация пользователей
    const userResponse = await axios.get(
      `${API_BASE_URL}/rest/user/getUserInfo/`,
      {
        params: {USER_ID: userId, API_KEY},
      },
    );
    if (userResponse.data.RESULT) {
      const user = userResponse.data.RESULT;
      db.transaction(tx => {
        tx.executeSql(
          `REPLACE INTO users (id, firstName, lastName, middleName, email) VALUES (?, ?, ?, ?, ?)`,
          [user.id, user.firstName, user.lastName, user.middleName, user.email],
        );
      });
      console.log('✅ User synced');
    }

    // 2. Синхронизация маршрутов
    const getTodayDate = (daysAgo = 0) => {
      const today = new Date();
      today.setDate(today.getDate() - daysAgo);
      return today.toISOString().split('T')[0];
    };
    const getFutureDate = daysAhead => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      return futureDate.toISOString().split('T')[0];
    };

    const today = getTodayDate(3);
    const futureDate = getFutureDate(7);

    const routesResponse = await axios.get(
      `${API_BASE_URL}/rest/routes/getList/`,
      {
        params: {
          USER_ID: userId,
          API_KEY,
          DATE_START: today,
          DATE_END: futureDate,
        },
      },
    );

    if (routesResponse.data.RESULT) {
      routes = routesResponse.data.RESULT;
      db.transaction(tx => {
        for (const route of routes) {
          tx.executeSql(
            `REPLACE INTO routes (id, number_route, date, quantity_orders, status, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              route.id.trim(),
              route.number_route.trim(),
              route.date,
              route.quantity_orders,
              route.status,
              route.user_id || userId,
            ],
          );
        }
      });
      console.log('✅ Routes synced:', routes.length);
    }

    if (!routes.length) {
      console.warn('⚠️ Нет маршрутов — синхронизация актов пропущена');
      return;
    }

    // 3. Синхронизация актов и заказов
    for (const route of routes) {
      const routeId = route.id.trim();
      try {
        const ordersResponse = await axios.get(
          `${API_BASE_URL}/rest/orders/getList/`,
          {
            params: {
              USER_ID: userId,
              ROUTE_ID: routeId,
              API_KEY,
            },
          },
        );

        const acts = ordersResponse.data.RESULT || [];
        console.log(
          `Полученные акты для маршрута ${routeId} (количество: ${acts.length}):`,
          acts,
        );
        console.log(
          `Уникальные number_act для маршрута ${routeId} (количество: ${
            [...new Set(acts.map(act => act.number_act))].length
          }):`,
          [...new Set(acts.map(act => act.number_act))],
        );

        if (acts.length > 0) {
          // Запись всех актов в одной транзакции
          await new Promise((resolve, reject) => {
            db.transaction(
              tx => {
                for (const act of acts) {
                  console.log(
                    `Сохраняем акт для маршрута ${routeId}: id=${act.id}, number_act=${act.number_act}`,
                  );
                  tx.executeSql(
                    `INSERT OR REPLACE INTO acts (id, address, qr, qr_act, number_act, createdAt, dateStart, dateEnd, status, updatedAt, user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      act.id?.trim() || '',
                      act.address || '',
                      act.qr || '',
                      act.qr_act || '',
                      act.number_act?.trim() || '',
                      act.createdAt || 0,
                      act.dateStart || 0,
                      act.dateEnd || 0,
                      act.status || '',
                      act.updatedAt || 0,
                      act.user_id || userId,
                    ],
                  );
                }
              },
              error => {
                console.error(
                  `Ошибка при сохранении актов для маршрута ${routeId}:`,
                  error,
                );
                reject(error);
              },
              () => {
                console.log(`✅ Все акты для маршрута ${routeId} сохранены`);
                resolve();
              },
            );
          });

          // Проверка содержимого таблицы acts после синхронизации
          await new Promise((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'SELECT * FROM acts',
                [],
                (_, {rows}) => {
                  console.log(
                    `Все акты в БД после синхронизации маршрута ${routeId} (количество: ${rows.length}):`,
                    rows.raw(),
                  );
                  resolve();
                },
                (_, err) => {
                  console.error('Ошибка при выборке из acts:', err);
                  reject(err);
                },
              );
            }, reject);
          });
        } else {
          console.warn(`⚠️ Нет актов для маршрута ${routeId}`);
        }

        // Синхронизация заказов
        for (const act of acts) {
          try {
            const orderDetailsResponse = await axios.get(
              `${API_BASE_URL}/rest/orders/getInfo/`,
              {
                params: {
                  USER_ID: userId,
                  ORDER_ID: act.number_act,
                  QR: act.qr_act,
                  API_KEY,
                },
              },
            );

            const order = orderDetailsResponse.data.RESULT;
            const products = [];

            if (order.items) products.push(order.items);
            Object.keys(order).forEach(key => {
              if (!isNaN(key) && order[key]?.id) {
                products.push(order[key]);
              }
            });

            await new Promise((resolve, reject) => {
              db.transaction(
                tx => {
                  tx.executeSql(
                    `REPLACE INTO orders (id, address, clientFio, qr, number_act, phone, items, comment, user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      order.id,
                      order.address || act.address,
                      order.clientFio || '',
                      act.qr,
                      order.number_act || act.number_act,
                      JSON.stringify(order.phone || []),
                      JSON.stringify(products),
                      order.comment || '',
                      order.user_id || userId,
                    ],
                  );
                },
                error => {
                  console.error(
                    `Ошибка при сохранении заказа для акта ${act.number_act}:`,
                    error,
                  );
                  reject(error);
                },
                () => {
                  console.log(
                    `📦 Заказ ${order.id} по акту ${act.number_act} сохранён`,
                  );
                  resolve();
                },
              );
            });
          } catch (error) {
            console.error(
              `❌ Ошибка при получении деталей акта ${act.id}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Ошибка при получении актов маршрута ${routeId}:`,
          error,
        );
      }
    }

    console.log('✅ Синхронизация завершена');
  } catch (error) {
    console.error('❌ Общая ошибка синхронизации:', error);
  }
};

export const syncPendingRequests = async () => {
  const db = getDB();
  if (!db) return;
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM pending_requests WHERE status = ?',
      ['pending'],
      async (_, {rows: {_array}}) => {
        for (const request of _array) {
          try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.get(
              `${API_BASE_URL}/rest/orders/setQR/`,
              {
                params: {
                  USER_ID: userId,
                  QR: request.qr,
                  PRODUCT_ID: request.productId,
                  DATA_MATRIX: request.dataMatrix,
                  API_KEY,
                },
              },
            );

            if (response.data.RESULT === 'OK') {
              tx.executeSql('DELETE FROM pending_requests WHERE id = ?', [
                request.id,
              ]);
              console.log(
                `✅ Pending request ${request.id} отправлен и удалён`,
              );
            }
          } catch (error) {
            console.error(
              `❌ Ошибка отправки pending request ${request.id}:`,
              error,
            );
          }
        }
      },
    );
  });
};
