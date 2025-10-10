
export default {
    routes: [
        // {
        //     method: 'PUT',
        //     path: '/batches/fulfill/:batchId',
        //     handler: 'batch.fulfill',
        // },
        {
            method: 'POST',
            path: '/batches/generateSingleBatch',
            handler: 'batch.generateSingleBatch',
        },
    ]
}