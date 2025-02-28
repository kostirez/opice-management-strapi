export default {
    /**
     * Simple example.
     * Every monday at 1am.
     */

    "* * * * *": async ({ strapi }) => {

        console.log('Running batch generation cron job...');

        // Define the constant (e.g., buffer days before delivery)
        const someConstant = 3; // Adjust as needed

        // Get today's date
        const today = new Date();

        const orders = await strapi.db.query('api::order.order').findMany({ // uid syntax: 'api::api-name.content-type-name'
            where: {
                active: true
            },
            populate: {
                deliveryTimes: true,
                plantsToGrow: {
                    populate: ['plant']
                }},

        });
        orders.pop()
        for (const order of orders) {
            if (!order.plantsToGrow || order.plantsToGrow.length === 0) {
                continue;
            }



            // Find the max timeToGrow among plants in this order
            const maxTimeToGrow = Math.max(...order.plantsToGrow.map(p => p.plant.timeToGrow));
            console.log('max time', maxTimeToGrow);
            // Calculate batch readiness date
            const batchReadyDate = new Date();
            batchReadyDate.setDate(today.getDate() + maxTimeToGrow + someConstant);
            console.log('batchReadyDate', batchReadyDate);
            const firstDelivery = new Date(order.firstDelivery.toString())
            console.log('batchReadyDate', batchReadyDate);
            console.log('firstDelivery', firstDelivery);
            console.log('order.deliveryTimes.preferTimeOfDelivery', order.deliveryTimes.preferTimeOfDelivery);
            let tempTime = order.deliveryTimes.preferTimeOfDelivery.split(":");
            batchReadyDate.setHours(tempTime[0]);
            batchReadyDate.setMinutes(tempTime[1]);
            batchReadyDate.setSeconds(tempTime[2]);
            console.log('batchReadyDate with time',batchReadyDate);
            // Check if batch should be created
            if (batchReadyDate >= firstDelivery) {
                const data = {
                    order: order.id,
                    dueToDate: batchReadyDate,
                    plantsToGrow: order.plantsToGrow.map(p => ({amount: p.amount, id: p.id})),
                    state: 'waiting',
                }
                console.log('data:', data);

                const batch = await strapi.db.query('api::batch.batch').create({data});

                console.log(`Created batch ${batch} for order ${order.id}`);
            }
        }
    },
};
