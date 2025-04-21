import { Context } from 'koa';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { generateInvoicePdf } from '../services/invoice';

export default {
    async generatePdf(ctx: Context) {
        const { customerId, month } = ctx.params;

        if (!customerId || !month) {
            return ctx.badRequest('Missing customerId or month');
        }


        const parsedMonth = parseISO(month); // e.g. 2024-04-01


        const start = startOfMonth(parsedMonth);
        const end = endOfMonth(parsedMonth);



        // 🧾 Fetch delivery actions
        const actions = await strapi.entityService.findMany('api::action.action', {
            filters: {
                state: 'done', // or whatever state you treat as valid for delivery
                timestamp: {
                    $gte: start,
                    $lte: end,
                },
                action_type: {
                    name: 'delivery', // assumes this field exists on action_type
                },
                batch: {
                    order: {
                        customer: {
                            id: customerId,
                        },
                    },
                },
            },
            populate: {
                plantBatch: {
                    populate: {
                        plant: true
                    }
                },

            },
        });
        const customer = await strapi.entityService.findMany('api::customer.customer', {
            filters: {
                id: customerId,
            },
            populate: {
                billing: {
                    populate: {
                        address: true
                    }
                },
                orders: {
                    populate: {
                        price_list: {
                            populate: {
                                list:{
                                    populate: {
                                        plant: true,
                                    }
                                }
                            },
                        }
                    },
                },
            }
        });

        const me = await strapi.entityService.findMany('api::my-billing.my-billing', {
            populate: {
                billing: {
                    populate: {
                        address: true
                    }
                }
            }
        });

        if (!actions || actions.length === 0) {
            return ctx.notFound('No delivery actions found for this customer and month');
        }


        // Generate PDF buffer
        const pdfBuffer = await generateInvoicePdf(actions, customer[0], me, parsedMonth);

        // Set headers to trigger download
        ctx.set('Content-Type', 'application/pdf');
        ctx.set('Content-Disposition', `attachment; filename="invoice-${month}.pdf"`);
        ctx.body = pdfBuffer;
    }
};