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
    ],
};
