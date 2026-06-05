export default {
    routes: [
        {
            method: 'GET',
            path: '/invoice/:customerId/:month',
            handler: 'invoice.generatePdf',
            config: {
                auth: false, // Set to true if you want to secure it
            },
        },

        {
            method: 'GET',
            path: '/invoice-box/:customerId/:month',
            handler: 'invoice.generateBoxPdf',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/invoice-aggregated/:customerId',
            handler: 'invoice.generateAggregatedPdf',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/invoice-delivery/:customerId/:month',
            handler: 'invoice.generateBatchDeliveryPdf',
            config: {
                auth: false,
            },
        },
    ],
};
