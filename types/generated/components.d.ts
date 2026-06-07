import type { Schema, Struct } from '@strapi/strapi';

export interface GrowBoxGroup extends Struct.ComponentSchema {
  collectionName: 'components_grow_box_groups';
  info: {
    displayName: 'boxGroup';
    icon: 'gift';
  };
  attributes: {
    amount: Schema.Attribute.Integer;
    box: Schema.Attribute.Enumeration<['BOX_S', 'BOX_M', 'BOX_L']>;
  };
}

export interface GrowCropBatch extends Struct.ComponentSchema {
  collectionName: 'components_grow_crop_batches';
  info: {
    displayName: 'CropBatch';
    icon: 'seed';
  };
  attributes: {
    amount: Schema.Attribute.Integer;
    plant: Schema.Attribute.Relation<'oneToOne', 'api::plant.plant'>;
    unit: Schema.Attribute.Enumeration<['GRAM', 'BOX_S', 'BOX_M', 'BOX_L']> &
      Schema.Attribute.DefaultTo<'GRAM'>;
  };
}

export interface GrowDeliveredBox extends Struct.ComponentSchema {
  collectionName: 'components_grow_delivered_boxes';
  info: {
    description: '';
    displayName: 'DeliveredBox';
    icon: 'archive';
  };
  attributes: {
    boxType: Schema.Attribute.Enumeration<['IKEA']>;
    count: Schema.Attribute.Integer;
    weight: Schema.Attribute.Integer;
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
    plant: Schema.Attribute.Relation<'oneToOne', 'api::plant.plant'>;
  };
}

export interface GrowRecipeBatch extends Struct.ComponentSchema {
  collectionName: 'components_grow_recipe_batches';
  info: {
    displayName: 'RecipeBatch';
    icon: 'database';
  };
  attributes: {
    amount: Schema.Attribute.Integer;
    recipe: Schema.Attribute.Relation<'oneToOne', 'api::recipe.recipe'>;
    unit: Schema.Attribute.Enumeration<['GRAM', 'BOX_S', 'BOX_M', 'BOX_L']>;
  };
}

export interface GrowRecipeItem extends Struct.ComponentSchema {
  collectionName: 'components_grow_recipe_items';
  info: {
    displayName: 'RecipeItem';
    icon: 'chartBubble';
  };
  attributes: {
    percent: Schema.Attribute.Integer;
    plant: Schema.Attribute.Relation<'oneToOne', 'api::plant.plant'>;
  };
}

export interface OfficeAddress extends Struct.ComponentSchema {
  collectionName: 'components_office_addresses';
  info: {
    description: '';
    displayName: 'address';
    icon: 'house';
  };
  attributes: {
    city: Schema.Attribute.String;
    country: Schema.Attribute.String;
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
    dic: Schema.Attribute.String;
    ico: Schema.Attribute.BigInteger;
    officialName: Schema.Attribute.String;
  };
}

export interface OfficeRecipePrice extends Struct.ComponentSchema {
  collectionName: 'components_office_recipe_prices';
  info: {
    displayName: 'RecipePrice';
    icon: 'chartPie';
  };
  attributes: {
    price: Schema.Attribute.Integer;
    recipe: Schema.Attribute.Relation<'oneToOne', 'api::recipe.recipe'>;
    unit: Schema.Attribute.Enumeration<['GRAM', 'BOX_S', 'BOX_M', 'BOX_L']>;
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
      'grow.box-group': GrowBoxGroup;
      'grow.crop-batch': GrowCropBatch;
      'grow.delivered-box': GrowDeliveredBox;
      'grow.plant-batch': GrowPlantBatch;
      'grow.recipe-batch': GrowRecipeBatch;
      'grow.recipe-item': GrowRecipeItem;
      'office.address': OfficeAddress;
      'office.billing': OfficeBilling;
      'office.recipe-price': OfficeRecipePrice;
      'time.calendar-rule': TimeCalendarRule;
      'time.days-in-week': TimeDaysInWeek;
    }
  }
}
