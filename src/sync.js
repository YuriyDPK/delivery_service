// src/sync.js
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
    // 1. Синхронизация пользователей
    const userResponse = await axios.get(
      `${API_BASE_URL}/rest/user/getUserInfo/`,
      {
        params: {USER_ID: userId, API_KEY},
      },
    );
    if (userResponse.data.RESULT) {
      console.log(userResponse.data.RESULT); // delete
      const user = userResponse.data.RESULT;
      db.transaction(tx => {
        tx.executeSql(
          `REPLACE INTO users (id, firstName, lastName, middleName, email) VALUES (?,?,?,?,?)`,
          [user.id, user.firstName, user.lastName, user.middleName, user.email],
        );
      });
      console.log('User synced to local DB');
    }

    // 2. Синхронизация маршрутов
    const routesResponse = await axios.get(
      `${API_BASE_URL}/rest/routes/getList/`,
      {
        params: {USER_ID: userId, API_KEY},
      },
    );
    if (routesResponse.data.RESULT) {
      console.log(routesResponse.data.RESULT); // delete
      const routes = routesResponse.data.RESULT;
      db.transaction(tx => {
        routes.forEach(route => {
          tx.executeSql(
            `REPLACE INTO routes (id, number_route, date, quantity_orders, status, user_id) VALUES (?,?,?,?,?,?)`,
            [
              route.id,
              route.number_route,
              route.date,
              route.quantity_orders,
              route.status,
              route.user_id || userId,
            ],
          );
        });
      });
      console.log('Routes synced to local DB');
    }

    // 3. Синхронизация заказов (без привязки к маршрутам)
    const ordersResponse = await axios.get(
      `${API_BASE_URL}/rest/orders/getList/`,
      {
        params: {USER_ID: userId, API_KEY}, // Убрали ROUTE_ID
      },
    );
    if (ordersResponse.data.RESULT) {
      console.log(ordersResponse.data.RESULT); // delete
      const orders = ordersResponse.data.RESULT;
      for (const order of orders) {
        const orderDetailsResponse = await axios.get(
          `${API_BASE_URL}/rest/orders/getInfo/`,
          {
            params: {
              USER_ID: userId,
              ORDER_ID: order.id,
              QR: order.qr, // QR доступен из /rest/orders/getList/
              API_KEY,
            },
          },
        );
        if (orderDetailsResponse.data.RESULT) {
          console.log(orderDetailsResponse.data.RESULT); // delete

          const orderDetails = orderDetailsResponse.data.RESULT;
          const products = [];
          if (orderDetails.items) products.push(orderDetails.items);
          Object.keys(orderDetails).forEach(key => {
            if (!isNaN(key) && orderDetails[key].id) {
              products.push(orderDetails[key]);
            }
          });

          db.transaction(tx => {
            tx.executeSql(
              `REPLACE INTO orders (id, address, clientFio, qr, number_act, phone, items, createdAt, dateStart, dateEnd, status, updatedAt, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                orderDetails.id || order.id,
                orderDetails.address || order.address,
                orderDetails.clientFio || '',
                order.qr,
                orderDetails.number_act || order.number_act,
                orderDetails.phone ? JSON.stringify(orderDetails.phone) : '[]',
                JSON.stringify(products),
                order.createdAt,
                order.dateStart,
                order.dateEnd,
                order.status,
                order.updatedAt,
                order.user_id || userId,
              ],
            );
          });
          console.log(`Order ${order.id} with products synced to local DB`);
        }
      }
    }

    console.log('All data successfully synced to local DB');
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
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
              console.log(`Request ${request.id} synced and deleted`);
            }
          } catch (error) {
            console.error('Error syncing request:', error);
          }
        }
      },
      (_, error) => console.error('Error fetching pending requests:', error),
    );
  });
};
