import { factories } from '@strapi/strapi';

// Only the create endpoint is exposed; leads are read in the admin panel.
export default factories.createCoreRouter('api::contact-submission.contact-submission', {
  only: ['create'],
});
