/**
 * day-action controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::day-action.day-action', ({ strapi }) => ({
  async customList(ctx) {
    const { DayInWeek, type, active } = ctx.query;

    const filters: any = {};

    if (DayInWeek) filters.DayInWeek = DayInWeek;
    if (type) filters.type = type;

    // Default to active: true unless specified otherwise
    if (active === 'false') {
      // show all or specifically inactive?
      // "get actions by type (by defould return only active but add query parameter)"
      // Usually "active" parameter would be true/false/all.
      // If it's explicitly 'false', we filter by active: false.
      filters.active = false;
    } else if (active === 'all') {
      // do not add active filter
    } else {
      // default behavior or explicitly active=true
      filters.active = true;
    }

    const entries = await strapi.entityService.findMany('api::day-action.day-action', {
      filters,
      populate: ['order', 'plant', 'operation_plan'],
    });

    return entries;
  },
}));
