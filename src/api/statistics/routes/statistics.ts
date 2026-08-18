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
    {
      method: 'GET',
      path: '/statistics/delivery-stats',
      handler: 'statistics.getDeliveryStats',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/statistics/item-comparison-stats',
      handler: 'statistics.getItemComparisonStats',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/statistics/time-log-stats',
      handler: 'statistics.getTimeLogStats',
      config: {
        auth: false,
      },
    },
  ],
};
