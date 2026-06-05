export default {
  routes: [
    {
      method: 'GET',
      path: '/crop-cycles/custom-list',
      handler: 'crop-cycle.customList',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/crop-cycles/create-many',
      handler: 'crop-cycle.createMany',
      config: {
        auth: false,
      },
    },
    {
      method: 'PATCH',
      path: '/crop-cycles/:id/move',
      handler: 'crop-cycle.move',
      config: {
        auth: false,
      },
    },
  ],
};
