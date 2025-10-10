
export default {
    routes: [
        {
            method: 'PUT',
            path: '/actions/fulfillAction/:id',
            handler: 'action.fulfillAction',
        },
        {
            method: 'POST',
            path: '/actions/generateOne/:batchId',
            handler: 'action.generateOne',
        },
        {
            method: 'POST',
            path: '/actions/generateActionsForBatch/:batchId',
            handler: 'action.generateActionsForBatch',
        },
    ]
}