/**
 * action service
 */

import { factories } from '@strapi/strapi';
import {ID} from "../../../model";
import dayjs from "dayjs";
import {ActionWithBatch} from "../types/action";

export default factories.createCoreService('api::action.action', ({strapi}) => ({

    generateActionsForBatch: async (batchId: ID) => {
        const batch = await strapi.service('api::batch.batch').getBatchWithPlantsToGrow(batchId)

        // @ts-ignore
        const plantsToGrow = batch.plantsToGrow;

        for (const plantToGrow of plantsToGrow) {
            const actions = plantToGrow.growStrategy.actions
            for (let action of actions) {
                const timeToExecute = dayjs(batch.dueToDate)
                    .subtract(action.daysBeforeHarvest, "day")
                const state = timeToExecute.isAfter(dayjs()) ? 'waiting' : 'done';
                const newAction = await strapi.entityService
                    .create('api::action.action', {
                        data: {
                            batch: batch.id,
                            state,
                            timestamp: timeToExecute.toDate(),
                            plantBatch: {
                                plant: plantToGrow.plant.id,
                                amount: plantToGrow.amount,
                                growStrategy: plantToGrow.growStrategy.id,
                            },
                            action_type: action.actionType.id,
                        }
                    });
            }
        }
        return 1;
    },


    fulfillAction: async (actionId: ID, timeInSeconds: number) => {
        // Update the action status and timeSpent
        const updatedAction = await strapi.entityService.update('api::action.action', actionId, {
            data: {
                state: 'done',
                timeSpent: timeInSeconds
            }
        });

        // Get the batch associated with this action
        const action = await strapi.entityService.findOne('api::action.action', actionId, {
            populate: {
                batch: true
            }
        }) as unknown as ActionWithBatch;

        // Get all actions for this batch
        const batchActions = await strapi.entityService.findMany('api::action.action', {
            filters: {
                batch: {
                    id: action.batch.id
                }
            }
        });

        // Check if all actions are done
        const allActionsDone = batchActions.every(action => action.state === 'done');
        const newBatchState = allActionsDone ? 'done' : 'running';

        // Update batch status
        await strapi.entityService.update('api::batch.batch', action.batch.id, {
            data: {
                state: newBatchState
            }
        });

        return updatedAction;
    },
}));
