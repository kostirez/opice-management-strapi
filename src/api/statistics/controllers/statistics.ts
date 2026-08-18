export default ({ strapi }) => ({
  async getHarvestUsage(ctx) {
    const { dateFrom, dateTo, group } = ctx.query;
    return await strapi.service('api::statistics.statistics').getHarvestUsage({
      dateFrom,
      dateTo,
      group: group || 'day'
    });
  },
  async getDeliveryStats(ctx) {
    const { orderIds, dateFrom, dateTo } = ctx.query;
    return await strapi.service('api::statistics.statistics').getDeliveryStats({
      orderIds,
      dateFrom,
      dateTo,
    });
  },
  async getItemComparisonStats(ctx) {
    const { orderIds, dateFrom, dateTo } = ctx.query;
    return await strapi.service('api::statistics.statistics').getItemComparisonStats({
      orderIds,
      dateFrom,
      dateTo,
    });
  },
  async getTimeLogStats(ctx) {
    const { category, userId, dateFrom, dateTo } = ctx.query;
    return await strapi.service('api::statistics.statistics').getTimeLogStats({
      category,
      userId,
      dateFrom,
      dateTo,
    });
  },
});
