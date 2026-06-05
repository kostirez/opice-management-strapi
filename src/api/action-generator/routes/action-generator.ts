export default {
  routes: [
    {
     method: 'POST',
     path: '/action-generator/migrate',
     handler: 'action-generator.migrate',
     config: {
       policies: [],
       middlewares: [],
     },
    },
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
