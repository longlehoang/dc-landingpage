import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsFeature extends Struct.ComponentSchema {
  collectionName: 'components_sections_features';
  info: {
    description: "A 'Why Dragon Capital' point with an icon";
    displayName: 'Feature';
    icon: 'star';
  };
  attributes: {
    icon: Schema.Attribute.Enumeration<['award', 'assets', 'flag']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'award'>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHeadlinePart extends Struct.ComponentSchema {
  collectionName: 'components_sections_headline_parts';
  info: {
    description: 'A run of headline text with its own colour';
    displayName: 'Headline part';
    icon: 'feather';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
    tone: Schema.Attribute.Enumeration<['light', 'gold', 'ivory']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'light'>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'A labelled link';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    openInNewTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLinkGroup extends Struct.ComponentSchema {
  collectionName: 'components_shared_link_groups';
  info: {
    description: 'A titled list of links, e.g. a footer column';
    displayName: 'Link group';
    icon: 'bulletList';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Page title and meta description';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'sections.feature': SectionsFeature;
      'sections.headline-part': SectionsHeadlinePart;
      'shared.link': SharedLink;
      'shared.link-group': SharedLinkGroup;
      'shared.seo': SharedSeo;
    }
  }
}
