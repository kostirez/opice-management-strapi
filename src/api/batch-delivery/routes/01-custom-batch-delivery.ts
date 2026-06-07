export default {
  routes: [
    {
      method: 'POST',
      path: '/batch-deliveries/bulk',
      handler: 'batch-delivery.createMany',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
