export default {
  routes: [
    {
     method: 'POST',
     path: '/action-generator',
     handler: 'action-generator.exampleAction',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
