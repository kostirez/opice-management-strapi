
export default {
    routes: [
        {
            method: 'POST',
            path: '/delivery/generateDelivery/:actionId',
            handler: 'delivery.generateDelivery',
        },
    ]
}