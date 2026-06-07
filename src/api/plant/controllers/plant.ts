/**
 * plant controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::plant.plant', ({ strapi }) => ({
  async syncRecipes(ctx) {
    try {
      const plants = await strapi.entityService.findMany('api::plant.plant', {limit: 100});
      const recipes = await strapi.entityService.findMany('api::recipe.recipe', {limit: 100});

      const existingRecipeNames = new Set(recipes.map((r: any) => r.name));
      const createdRecipes = [];

      for (const plant of plants) {
        if (!existingRecipeNames.has(plant.name)) {
          const newRecipe = await strapi.entityService.create('api::recipe.recipe', {
            data: {
              name: plant.name,
              code: plant.code,
              totalGrowTime: (plant.timeToGrow || 0) + (plant.germinationTime || 0),
              items: [
                {
                  plant: plant.id,
                  percent: 100,
                },
              ],
            },
          });
          createdRecipes.push(newRecipe);
          existingRecipeNames.add(plant.name);
          console.log(`Created recipe for plant: ${plant.name}`);
        } else {
          console.log(`Recipe for plant ${plant.name} already exists, skipping.`);
        }
      }

      return {
        message: 'Sync completed',
        count: createdRecipes.length,
        created: createdRecipes.map((r: any) => r.name),
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}));
