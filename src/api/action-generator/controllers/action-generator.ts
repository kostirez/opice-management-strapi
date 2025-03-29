/**
 * A set of functions called "actions" for `action-generator`
 */
import {generateActionsForBatch} from "../../../helpers/generate";

export default {
  exampleAction: async (ctx, next) => {
    const data = ctx.request.body;
    try {
      await generateActionsForBatch(data.batchId)
      ctx.body = 'ok';
    } catch (err) {
      ctx.body = err;
    }
  }
};
