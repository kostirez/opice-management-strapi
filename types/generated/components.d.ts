import type { Schema, Struct } from '@strapi/strapi';

export interface GrowPlantBatch extends Struct.ComponentSchema {
  collectionName: 'components_grow_plant_batches';
  info: {
    displayName: 'PlantBatch';
    icon: 'seed';
  };
  attributes: {
    amount: Schema.Attribute.Integer;
    plant: Schema.Attribute.Relation<'oneToOne', 'api::plant.plant'>;
  };
}

export interface OfficeAddress extends Struct.ComponentSchema {
  collectionName: 'components_office_addresses';
  info: {
    displayName: 'address';
    icon: 'house';
  };
  attributes: {
    city: Schema.Attribute.String;
    postCode: Schema.Attribute.String;
    street: Schema.Attribute.String;
  };
}

export interface OfficeBilling extends Struct.ComponentSchema {
  collectionName: 'components_office_billings';
  info: {
    description: '';
    displayName: 'billing';
    icon: 'briefcase';
  };
  attributes: {
    address: Schema.Attribute.Component<'office.address', false>;
    dic: Schema.Attribute.BigInteger;
    ico: Schema.Attribute.BigInteger;
    officialName: Schema.Attribute.String;
  };
}

export interface TimeCalendarRule extends Struct.ComponentSchema {
  collectionName: 'components_time_calendar_rules';
  info: {
    displayName: 'CalendarRule';
    icon: 'calendar';
  };
  attributes: {
    daysInWeek: Schema.Attribute.Enumeration<
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    >;
    preferTimeOfDelivery: Schema.Attribute.Time;
    until: Schema.Attribute.Date;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'grow.plant-batch': GrowPlantBatch;
      'office.address': OfficeAddress;
      'office.billing': OfficeBilling;
      'time.calendar-rule': TimeCalendarRule;
    }
  }
}
