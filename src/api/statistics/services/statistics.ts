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
  }
});
