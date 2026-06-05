export default {
  routes: [
    {
      method: 'GET',
      path: '/day-actions/custom-list',
      handler: 'day-action.customList',
      config: {
        auth: false,
      },
    },
  ],
};
