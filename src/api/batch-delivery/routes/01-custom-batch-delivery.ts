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
    {
      method: 'GET',
      path: '/batch-deliveries/overview',
      handler: 'batch-delivery.getOverview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/batch-deliveries/details/:id',
      handler: 'batch-delivery.getDetailById',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
