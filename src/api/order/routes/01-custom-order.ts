export default {
  routes: [
    {
      method: 'GET',
      path: '/orders/delivery-list',
      handler: 'order.deliveryList',
      config: {
        auth: false,
      },
    },
  ],
};
