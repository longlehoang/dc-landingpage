import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksAnchorNav extends Struct.ComponentSchema {
  collectionName: 'components_blocks_anchor_navs';
  info: {
    description: 'Sticky in-page tabs that scroll to anchors';
    displayName: 'Anchor nav';
    icon: 'layout';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface BlocksAppPromo extends Struct.ComponentSchema {
  collectionName: 'components_blocks_app_promos';
  info: {
    description: 'DragonX app download block';
    displayName: 'App promo';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    appStoreUrl: Schema.Attribute.String;
    buttonLabel: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    moreLink: Schema.Attribute.Component<'shared.link', false>;
    moreText: Schema.Attribute.String;
    playStoreUrl: Schema.Attribute.String;
    qr: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksCard extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cards';
  info: {
    description: 'Item of a cards block';
    displayName: 'Card';
    icon: 'layout';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    subtitle: Schema.Attribute.String;
    tag: Schema.Attribute.String;
    text: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
  };
}

export interface BlocksCards extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cardss';
  info: {
    description: 'A set of cards; the variant chooses the layout';
    displayName: 'Cards';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    items: Schema.Attribute.Component<'blocks.card', true>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
    titleHighlight: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<
      [
        'grid',
        'solutions',
        'accordion',
        'offices',
        'logos',
        'benefits',
        'ctaBanner',
      ]
    > &
      Schema.Attribute.DefaultTo<'grid'>;
  };
}

export interface BlocksContactForm extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_forms';
  info: {
    description: 'Lead form stored as a Contact submission';
    displayName: 'Contact form';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    companyLabel: Schema.Attribute.String;
    disclaimer: Schema.Attribute.RichText;
    emailLabel: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    messageLabel: Schema.Attribute.String;
    nameLabel: Schema.Attribute.String;
    optInLabel: Schema.Attribute.Text;
    phoneLabel: Schema.Attribute.String;
    submitLabel: Schema.Attribute.String;
    successMessage: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<['panel', 'centered']> &
      Schema.Attribute.DefaultTo<'panel'>;
  };
}

export interface BlocksDocumentLibrary extends Struct.ComponentSchema {
  collectionName: 'components_blocks_document_librarys';
  info: {
    description: 'Filterable fund documents (Fund document collection)';
    displayName: 'Document library';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    defaultFund: Schema.Attribute.String;
    funds: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFaq extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faqs';
  info: {
    description: 'Questions grouped by category';
    displayName: 'FAQ';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    groups: Schema.Attribute.Component<'blocks.faq-group', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFaqGroup extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faq_groups';
  info: {
    description: 'Category of questions';
    displayName: 'FAQ group';
    icon: 'layout';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.faq-item', true>;
    name: Schema.Attribute.String;
  };
}

export interface BlocksFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faq_items';
  info: {
    description: 'Question and answer';
    displayName: 'FAQ item';
    icon: 'layout';
  };
  attributes: {
    answer: Schema.Attribute.RichText;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksFeatures extends Struct.ComponentSchema {
  collectionName: 'components_blocks_featuress';
  info: {
    description: 'Icon + statement row ("Why Dragon Capital")';
    displayName: 'Features';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    items: Schema.Attribute.Component<'blocks.icon-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFundCard extends Struct.ComponentSchema {
  collectionName: 'components_blocks_fund_cards';
  info: {
    description: 'Reference to a fund by slug, with optional overrides';
    displayName: 'Fund card';
    icon: 'layout';
  };
  attributes: {
    fundSlug: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.Media<'images'>;
    returnPeriod: Schema.Attribute.Enumeration<
      ['1M', '3M', 'ytd', '1Y', '3Y', '5Y', '12M']
    >;
    subtitle: Schema.Attribute.String;
    tag: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFundCards extends Struct.ComponentSchema {
  collectionName: 'components_blocks_fund_cardss';
  info: {
    description: 'Cards for funds, with live figures from the Fund collection';
    displayName: 'Fund cards';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    funds: Schema.Attribute.Component<'blocks.fund-card', true>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heros';
  info: {
    description: 'Top banner of a page';
    displayName: 'Hero';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    animation: Schema.Attribute.Media<'files'>;
    contacts: Schema.Attribute.Component<'shared.contact-item', true>;
    cta: Schema.Attribute.Component<'shared.link', false>;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    mobileAnimation: Schema.Attribute.Media<'files'>;
    mobileImage: Schema.Attribute.Media<'images'>;
    slides: Schema.Attribute.Component<'blocks.hero-slide', true>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    titleParts: Schema.Attribute.Component<'sections.headline-part', true>;
    variant: Schema.Attribute.Enumeration<
      ['banner', 'pageTitle', 'pageTitleLight', 'plain', 'carousel']
    > &
      Schema.Attribute.DefaultTo<'banner'>;
  };
}

export interface BlocksHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_blocks_hero_slides';
  info: {
    description: 'One slide of a carousel hero';
    displayName: 'Hero slide';
    icon: 'layout';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    image: Schema.Attribute.Media<'images'>;
    paginationLabel: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksIconItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_icon_items';
  info: {
    description: 'Icon with a short statement';
    displayName: 'Icon item';
    icon: 'layout';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksMilestone extends Struct.ComponentSchema {
  collectionName: 'components_blocks_milestones';
  info: {
    description: 'One timeline entry';
    displayName: 'Milestone';
    icon: 'layout';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksNewsFeed extends Struct.ComponentSchema {
  collectionName: 'components_blocks_news_feeds';
  info: {
    description: 'Latest articles';
    displayName: 'News feed';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    category: Schema.Attribute.Enumeration<
      ['CAT1', 'CAT2', 'CAT3', 'CAT4', 'CAT5']
    >;
    count: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    eyebrow: Schema.Attribute.String;
    moreLabel: Schema.Attribute.String;
    moreUrl: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface BlocksNewsIndex extends Struct.ComponentSchema {
  collectionName: 'components_blocks_news_indexs';
  info: {
    description: 'Filterable list of every article';
    displayName: 'News index';
    icon: 'layout';
  };
  attributes: {
    allLabel: Schema.Attribute.String & Schema.Attribute.Required;
    anchor: Schema.Attribute.String;
    emptyText: Schema.Attribute.String;
  };
}

export interface BlocksRichText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_texts';
  info: {
    description: 'Text block with optional image';
    displayName: 'Rich text';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    body: Schema.Attribute.RichText;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'right'>;
    narrow: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface BlocksStat extends Struct.ComponentSchema {
  collectionName: 'components_blocks_stats';
  info: {
    description: 'One key number';
    displayName: 'Stat';
    icon: 'layout';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksStats extends Struct.ComponentSchema {
  collectionName: 'components_blocks_statss';
  info: {
    description: 'Key numbers';
    displayName: 'Stats';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    items: Schema.Attribute.Component<'blocks.stat', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksTeam extends Struct.ComponentSchema {
  collectionName: 'components_blocks_teams';
  info: {
    description: 'Leadership grouped in tabs';
    displayName: 'Team';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    groups: Schema.Attribute.Component<'blocks.team-group', true>;
    quote: Schema.Attribute.Text;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksTeamGroup extends Struct.ComponentSchema {
  collectionName: 'components_blocks_team_groups';
  info: {
    description: 'Tab of people';
    displayName: 'Team group';
    icon: 'layout';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    people: Schema.Attribute.Component<'blocks.team-member', true>;
  };
}

export interface BlocksTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_blocks_team_members';
  info: {
    description: 'Person with role and bio';
    displayName: 'Team member';
    icon: 'layout';
  };
  attributes: {
    bio: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images'>;
    linkedinUrl: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    role: Schema.Attribute.String;
  };
}

export interface BlocksTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_blocks_testimonials';
  info: {
    description: 'One investor quote';
    displayName: 'Testimonial';
    icon: 'layout';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    quote: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BlocksTestimonials extends Struct.ComponentSchema {
  collectionName: 'components_blocks_testimonialss';
  info: {
    description: 'Investor quotes carousel';
    displayName: 'Testimonials';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    items: Schema.Attribute.Component<'blocks.testimonial', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksTimeline extends Struct.ComponentSchema {
  collectionName: 'components_blocks_timelines';
  info: {
    description: 'Milestones by year';
    displayName: 'Timeline';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    items: Schema.Attribute.Component<'blocks.milestone', true>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksVideoCarousel extends Struct.ComponentSchema {
  collectionName: 'components_blocks_video_carousels';
  info: {
    description: 'Slides of video + text';
    displayName: 'Video carousel';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    slides: Schema.Attribute.Component<'blocks.video-slide', true>;
  };
}

export interface BlocksVideoSlide extends Struct.ComponentSchema {
  collectionName: 'components_blocks_video_slides';
  info: {
    description: 'Embedded video with text';
    displayName: 'Video slide';
    icon: 'layout';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    text: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
    videoUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FundManager extends Struct.ComponentSchema {
  collectionName: 'components_fund_managers';
  info: {
    description: 'Portfolio manager shown on a fund page';
    displayName: 'Fund manager';
    icon: 'link';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    role: Schema.Attribute.String;
    stats: Schema.Attribute.Component<'blocks.stat', true>;
  };
}

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
    tone: Schema.Attribute.Enumeration<['light', 'gold', 'ivory', 'green']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'light'>;
  };
}

export interface SharedContactItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_contact_items';
  info: {
    description: 'Label + value with optional link (mailto:/tel:)';
    displayName: 'Contact item';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedKeyValue extends Struct.ComponentSchema {
  collectionName: 'components_shared_key_values';
  info: {
    description: 'Label/value row, e.g. fund key facts';
    displayName: 'Key value';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.Text;
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

export interface SharedNavGroup extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_groups';
  info: {
    description: 'Column of links inside a dropdown panel';
    displayName: 'Nav group';
    icon: 'link';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedNavItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_items';
  info: {
    description: 'Header menu entry; groups make it a dropdown panel';
    displayName: 'Nav item';
    icon: 'link';
  };
  attributes: {
    groups: Schema.Attribute.Component<'shared.nav-group', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    panelTitle: Schema.Attribute.String;
    url: Schema.Attribute.String;
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

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Link to a social network profile';
    displayName: 'Social link';
    icon: 'link';
  };
  attributes: {
    network: Schema.Attribute.Enumeration<
      ['linkedin', 'facebook', 'youtube', 'zalo', 'x']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.anchor-nav': BlocksAnchorNav;
      'blocks.app-promo': BlocksAppPromo;
      'blocks.card': BlocksCard;
      'blocks.cards': BlocksCards;
      'blocks.contact-form': BlocksContactForm;
      'blocks.document-library': BlocksDocumentLibrary;
      'blocks.faq': BlocksFaq;
      'blocks.faq-group': BlocksFaqGroup;
      'blocks.faq-item': BlocksFaqItem;
      'blocks.features': BlocksFeatures;
      'blocks.fund-card': BlocksFundCard;
      'blocks.fund-cards': BlocksFundCards;
      'blocks.hero': BlocksHero;
      'blocks.hero-slide': BlocksHeroSlide;
      'blocks.icon-item': BlocksIconItem;
      'blocks.milestone': BlocksMilestone;
      'blocks.news-feed': BlocksNewsFeed;
      'blocks.news-index': BlocksNewsIndex;
      'blocks.rich-text': BlocksRichText;
      'blocks.stat': BlocksStat;
      'blocks.stats': BlocksStats;
      'blocks.team': BlocksTeam;
      'blocks.team-group': BlocksTeamGroup;
      'blocks.team-member': BlocksTeamMember;
      'blocks.testimonial': BlocksTestimonial;
      'blocks.testimonials': BlocksTestimonials;
      'blocks.timeline': BlocksTimeline;
      'blocks.video-carousel': BlocksVideoCarousel;
      'blocks.video-slide': BlocksVideoSlide;
      'fund.manager': FundManager;
      'sections.feature': SectionsFeature;
      'sections.headline-part': SectionsHeadlinePart;
      'shared.contact-item': SharedContactItem;
      'shared.key-value': SharedKeyValue;
      'shared.link': SharedLink;
      'shared.link-group': SharedLinkGroup;
      'shared.nav-group': SharedNavGroup;
      'shared.nav-item': SharedNavItem;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
    }
  }
}
