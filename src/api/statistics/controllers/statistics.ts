export default ({ strapi }) => ({
  async getHarvestUsage(ctx) {
    const { dateFrom, dateTo, group } = ctx.query;
    return await strapi.service('api::statistics.statistics').getHarvestUsage({
      dateFrom,
      dateTo,
      group: group || 'day'
    });
  },
});
