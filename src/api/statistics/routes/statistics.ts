export default {
  routes: [
    {
      method: 'GET',
      path: '/statistics/harvest-usage',
      handler: 'statistics.getHarvestUsage',
      config: {
        auth: false,
      },
    },
  ],
};
