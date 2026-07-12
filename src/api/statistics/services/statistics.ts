import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export default ({ strapi }) => ({
  async getHarvestUsage({ dateFrom, dateTo, group }: { dateFrom?: string, dateTo?: string, group: string }) {
    const filters: any = {};

    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = dateFrom;
      if (dateTo) filters.date.$lte = dateTo;
    }

    const harvests = await strapi.entityService.findMany('api::batch-harvest.batch-harvest', {
      filters,
      populate: {
        harvestedCrops: {
          populate: ['plant']
        },
        usedHarvest: {
          populate: ['plant']
        }
      },
      sort: { date: 'asc' }
    });

    const groupedData = this.groupData(harvests, group);

    return Object.entries(groupedData).map(([date, data]: [string, any]) => ({
      date,
      harvested: data.harvested,
      used: data.used,
    }));
  },

  groupData(items: any[], group: string) {
    const groups: any = {};

    items.forEach(item => {
      if (!item.date) return;
      const date = dayjs(item.date);
      let groupKey: string;

      if (group === 'week') {
        groupKey = date.startOf('isoWeek').format('YYYY-MM-DD');
      } else if (group === 'month') {
        groupKey = date.startOf('month').format('YYYY-MM');
      } else {
        groupKey = date.startOf('day').format('YYYY-MM-DD');
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { harvested: 0, used: 0 };
      }

      if (item.harvestedCrops) {
        item.harvestedCrops.forEach((crop: any) => {
          groups[groupKey].harvested += crop.amount || 0;
        });
      }

      if (item.usedHarvest) {
        item.usedHarvest.forEach((crop: any) => {
          groups[groupKey].used += crop.amount || 0;
        });
      }
    });

    return groups;
  },

  async getDeliveryStats({ orderIds, dateFrom, dateTo }: { orderIds?: string | string[], dateFrom?: string, dateTo?: string }) {
    const filters: any = {};

    if (orderIds) {
      filters.order = {
        id: Array.isArray(orderIds) ? { $in: orderIds } : orderIds
      };
    }

    if (dateFrom || dateTo) {
      filters.deliveredAt = {};
      if (dateFrom) filters.deliveredAt.$gte = dateFrom;
      if (dateTo) filters.deliveredAt.$lte = dateTo;
    }

    const batchDeliveries = await strapi.entityService.findMany('api::batch-delivery.batch-delivery', {
      filters,
      populate: {
        order: {
          populate: ['deliveryTimes']
        }
      },
      sort: { deliveredAt: 'asc' }
    });

    return batchDeliveries.map((delivery: any) => {
      if (!delivery.deliveredAt || !delivery.order?.deliveryTimes?.preferTimeOfDelivery) {
        return {
          batchDeliveryId: delivery.id,
          orderId: delivery.order?.id,
          deliveredAt: delivery.deliveredAt,
          preferTimeOfDelivery: delivery.order?.deliveryTimes?.preferTimeOfDelivery,
          diffMinutes: null
        };
      }

      const deliveredAt = dayjs(delivery.deliveredAt);
      const preferTime = delivery.order.deliveryTimes.preferTimeOfDelivery; // HH:mm:ss.SSS

      // Create a dayjs object for the preferred time on the same day as deliveredAt
      const [hours, minutes, seconds] = preferTime.split(':').map(Number);
      const preferredTimeOnDay = deliveredAt.clone()
        .hour(hours)
        .minute(minutes)
        .second(seconds || 0)
        .millisecond(0);

      const diffMinutes = deliveredAt.diff(preferredTimeOnDay, 'minute');

      return {
        batchDeliveryId: delivery.id,
        orderId: delivery.order.id,
        deliveredAt: delivery.deliveredAt,
        preferTimeOfDelivery: preferTime,
        diffMinutes
      };
    });
  },

  async getItemComparisonStats({ orderIds, dateFrom, dateTo }: { orderIds?: string | string[], dateFrom?: string, dateTo?: string }) {
    const filters: any = {};

    if (orderIds) {
      filters.order = {
        id: Array.isArray(orderIds) ? { $in: orderIds } : orderIds
      };
    }

    if (dateFrom || dateTo) {
      filters.deliveredAt = {};
      if (dateFrom) filters.deliveredAt.$gte = dateFrom;
      if (dateTo) filters.deliveredAt.$lte = dateTo;
    }

    const batchDeliveries = await strapi.entityService.findMany('api::batch-delivery.batch-delivery', {
      filters,
      populate: {
        order: true,
        expectedItems: {
          populate: ['recipe']
        },
        deliveredItems: {
          populate: ['recipe']
        }
      },
      sort: { deliveredAt: 'asc' }
    });

    return batchDeliveries.map((delivery: any) => {
      const expectedSummary = (delivery.expectedItems || []).reduce((acc: any, item: any) => {
        const recipeId = item.recipe?.id;
        if (!recipeId) return acc;
        if (!acc[recipeId]) {
          acc[recipeId] = { recipeId, name: item.recipe.name, expectedAmount: 0, deliveredAmount: 0 };
        }
        acc[recipeId].expectedAmount += item.amount || 0;
        return acc;
      }, {});

      (delivery.deliveredItems || []).forEach((item: any) => {
        const recipeId = item.recipe?.id;
        if (!recipeId) return;
        if (!expectedSummary[recipeId]) {
          expectedSummary[recipeId] = { recipeId, name: item.recipe.name, expectedAmount: 0, deliveredAmount: 0 };
        }
        expectedSummary[recipeId].deliveredAmount += item.amount || 0;
      });

      const items = Object.values(expectedSummary).map((item: any) => ({
        ...item,
        difference: item.deliveredAmount - item.expectedAmount
      }));

      return {
        batchDeliveryId: delivery.id,
        orderId: delivery.order?.id,
        deliveredAt: delivery.deliveredAt,
        items
      };
    });
  }
});
