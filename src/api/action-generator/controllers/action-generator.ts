/**
 * A set of functions called "actions" for `action-generator`
 */
import {generateActionsForBatch, generateBatchesForDates, generateSingleBatch} from "../../../helpers/generate";

import {migrateActionsToDeliveries} from "../../../../scripts/migrate-deliveries";

export default {
  migrate: async (ctx) => {
    const { startDate, endDate, orderId } = ctx.request.body;
    try {
      await migrateActionsToDeliveries({ startDate, endDate, orderId });
      ctx.body = 'Migration completed';
    } catch (err) {
      console.error(err);
      ctx.throw(500, err);
    }
  },
  exampleAction: async (ctx, next) => {
    const data= ctx.request.body;
    try {
      // await generateSingleBatch(data.orderId, data.deliveryDate)
      //  ['2025-05-02', '2025-05-07', '2025-05-09', '2025-05-13', '2025-05-16', '2025-05-20', '2025-05-23', '2025-05-27', '2025-05-30']
      await generateBatchesForDates(data.orderId, ['2025-08-08', '2025-08-15', '2025-08-22', '2025-08-29', '2025-09-05', '2025-09-12', '2025-09-19', '2025-09-27']);
      ctx.body = 'ok';
      return 'ok'
    } catch (err) {
      console.log(err)
      ctx.body = err;
    }
  }
};
