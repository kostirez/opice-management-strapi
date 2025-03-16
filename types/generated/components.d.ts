import type { Schema, Struct } from '@strapi/strapi';

export interface GrowActionTime extends Struct.ComponentSchema {
  collectionName: 'components_grow_action_times';
  info: {
    description: '';
    displayName: 'ActionTime';
    icon: 'rocket';
  };
  attributes: {
    actionType: Schema.Attribute.Relation<
      'oneToOne',
      'api::action-type.action-type'
    >;
    daysBeforeHarvest: Schema.Attribute.Integer;
  };
}

export interface GrowPlantBatch extends Struct.ComponentSchema {
  collectionName: 'components_grow_plant_batches';
  info: {
    description: '';
    displayName: 'PlantBatch';
    icon: 'seed';
  };
  attributes: {
    amount: Schema.Attribute.Integer;
    growStrategy: Schema.Attribute.Relation<
      'oneToOne',
      'api::grow-strategy.grow-strategy'
    >;
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
    description: '';
    displayName: 'CalendarRule';
    icon: 'calendar';
  };
  attributes: {
    daysInWeek: Schema.Attribute.Component<'time.days-in-week', true>;
    preferTimeOfDelivery: Schema.Attribute.Time;
    until: Schema.Attribute.Date;
  };
}

export interface TimeDaysInWeek extends Struct.ComponentSchema {
  collectionName: 'components_time_days_in_weeks';
  info: {
    displayName: 'DaysInWeek';
    icon: 'medium';
  };
  attributes: {
    day: Schema.Attribute.Enumeration<
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'grow.action-time': GrowActionTime;
      'grow.plant-batch': GrowPlantBatch;
      'office.address': OfficeAddress;
      'office.billing': OfficeBilling;
      'time.calendar-rule': TimeCalendarRule;
      'time.days-in-week': TimeDaysInWeek;
    }
  }
}
