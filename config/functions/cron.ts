import { generateBatch } from "../../src/helpers/generate";

export default {
    /**
     * Simple example.
     * Every day at 3am.
     */

    "0 3 * * *": async ({ strapi }) => {
        console.log('start')
        await generateBatch(strapi);
    },
};
