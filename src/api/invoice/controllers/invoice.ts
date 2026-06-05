import { Context } from 'koa';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { generateInvoicePdf, generateAggregatedInvoicePdf, generateBoxInvoicePdf, generateBatchDeliveryInvoicePdf } from '../services/invoice';

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
                recipe: true,
                unit: true
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
                                },
                                recipeList: {
                                    populate: {
                                        recipe: true
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
    },

    async generateBoxPdf(ctx: Context) {
        const { customerId, month } = ctx.params;

        if (!customerId || !month) {
            return ctx.badRequest('Missing customerId or month');
        }

        const parsedMonth = parseISO(month);
        const start = startOfMonth(parsedMonth);
        const end = endOfMonth(parsedMonth);

        console.log('zacatek konec',start, end);

        // Fetch batches for this customer that have deliveries in this month
        const batches = await strapi.entityService.findMany('api::batch.batch', {
            filters: {
                dueToDate: {
                    $gte: start,
                    $lte: end,
                },
                order: {
                    customer: {
                        id: customerId,
                    },
                },
            },
            populate: {
                deliveries: {
                    populate: {
                        box_batches: {
                            populate: {
                                plant: true,
                            }
                        }
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
                                },
                                boxList:{
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

        if (!batches || batches.length === 0) {
            return ctx.notFound('NgroupDeliveriesByDateo deliveries found for this customer and month');
        }

        // Generate PDF buffer
        const pdfBuffer = await generateBoxInvoicePdf(batches, customer[0], me, parsedMonth);

        console.log('batches', batches)

        // Set headers to trigger download
        ctx.set('Content-Type', 'application/pdf');
        ctx.set('Content-Disposition', `attachment; filename="invoice-box-${month}.pdf"`);
        ctx.body = pdfBuffer;
    },

    async generateAggregatedPdf(ctx: Context) {
        const { customerId } = ctx.params;
        const { months } = ctx.request.body as any;

        if (!customerId || !months || !Array.isArray(months) || months.length === 0) {
            return ctx.badRequest('Missing customerId or months array');
        }

        const parsedMonths = months.map(m => parseISO(m));
        const filters = parsedMonths.map(m => ({
            timestamp: {
                $gte: startOfMonth(m),
                $lte: endOfMonth(m),
            }
        }));

        // 🧾 Fetch delivery actions
        const actions = await strapi.entityService.findMany('api::action.action', {
            filters: {
                state: 'done',
                $or: filters,
                action_type: {
                    name: 'delivery',
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
                recipe: true,
                unit: true
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
                                list: {
                                    populate: {
                                        plant: true,
                                    }
                                },
                                recipeList: {
                                    populate: {
                                        recipe: true
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
            return ctx.notFound('No delivery actions found for this customer and months');
        }

        // Generate PDF buffer
        // Use the first month for the invoice number generation logic or similar
        const pdfBuffer = await generateAggregatedInvoicePdf(actions, customer[0], me, parsedMonths[0]);

        // Set headers to trigger download
        ctx.set('Content-Type', 'application/pdf');
        ctx.set('Content-Disposition', `attachment; filename="invoice-aggregated.pdf"`);
        ctx.body = pdfBuffer;
    },

    async generateBatchDeliveryPdf(ctx: Context) {
        const { customerId, month } = ctx.params;

        if (!customerId || !month) {
            return ctx.badRequest('Missing customerId or month');
        }

        const parsedMonth = parseISO(month);
        const start = startOfMonth(parsedMonth);
        const end = endOfMonth(parsedMonth);

        // Fetch batch deliveries for this customer in this month
        const deliveries = await strapi.entityService.findMany('api::batch-delivery.batch-delivery', {
            filters: {
                state: 'DELIVERED',
                deliveredAt: {
                    $gte: start,
                    $lte: end,
                },
                order: {
                    customer: {
                        id: customerId,
                    },
                },
            },
            populate: {
                deliveredItems: {
                    populate: {
                        recipe: true,
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
                                },
                                recipeList: {
                                    populate: {
                                        recipe: true
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

        if (!deliveries || deliveries.length === 0) {
            return ctx.notFound('No deliveries found for this customer and month');
        }

        // Generate PDF buffer
        const pdfBuffer = await generateBatchDeliveryInvoicePdf(deliveries, customer[0], me[0] || me, parsedMonth);

        // Set headers to trigger download
        ctx.set('Content-Type', 'application/pdf');
        ctx.set('Content-Disposition', `attachment; filename="invoice-delivery-${month}.pdf"`);
        ctx.body = pdfBuffer;
    }
};