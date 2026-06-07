export default {
  routes: [
    {
      method: 'POST',
      path: '/plants/sync-recipes',
      handler: 'api::plant.plant.syncRecipes',
      config: {
        auth: false,
      },
    },
  ],
};
