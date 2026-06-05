/**
 * operation-plan controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::operation-plan.operation-plan', ({ strapi }) => ({
    async getActive(ctx) {
        const entity = await strapi.db.query('api::operation-plan.operation-plan').findOne({
            where: { active: true },
            populate: {
                day_actions: {
                    populate: {
                        plant: true,
                        order: true,
                    }
                },
                day_yields: {
                    populate: {
                        plant: true,
                    }
                },
                occupancies: true,
            },
        });

        if (!entity) {
            return ctx.notFound('Active operation plan not found');
        }

        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
    },
}));
