/**
 * Rohan Kapoor — single source of truth for cloneable photographer sites.
 * Edit this file to rebrand for another client.
 */
window.SITE = {
  brandName: 'Rohan Kapoor',
  tagline: 'Premium Indian Wedding Photography',
  primaryCity: 'Chandigarh',
  email: 'hello@rohankapoor.photo',
  whatsapp: '919876543210',
  instagram: 'rohankapoor.photo',
  canonicalUrl: 'https://rohan-kapoor.vercel.app/',
  seasonsPerYear: 12,

  contact: {
    email: 'hello@rohankapoor.photo',
    whatsappUrl: 'https://wa.me/919876543210',
    whatsappLabel: 'Message Rohan',
    instagramUrl: 'https://instagram.com/rohankapoor.photo',
    instagramHandle: '@rohankapoor.photo',
  },

  bookingTrust: [
    'Response within <strong>48 hours</strong>',
    'Only <strong>12 weddings</strong> per season',
    'Consultation is <strong>complimentary</strong>',
  ],

  packages: [
    {
      id: 'essential',
      name: 'Essential',
      range: 'From ₹1.8L',
      features: 'Full-day coverage · 400+ edited images · Online gallery',
      outcome: 'Ideal for intimate city weddings with a focused guest list.',
    },
    {
      id: 'heirloom',
      name: 'Heirloom',
      range: 'From ₹2.8L',
      features: 'Two photographers · Album · Parent albums · Priority editing',
      outcome: 'Best for families who want heirlooms across every ritual and generation.',
      featured: true,
      badge: 'Most chosen',
    },
    {
      id: 'destination',
      name: 'Destination',
      range: 'Custom',
      features: 'Multi-day coverage · Travel included · Fine-art print suite',
      outcome: 'Built for palace, resort, and multi-city celebrations abroad.',
    },
  ],

  testimonials: [
    {
      quote: 'The haldi photograph — my mother laughing with turmeric on her cheeks — is the one our family prints for every anniversary. Rohan caught the chaos and the love in the same frame.',
      couple: 'Priya & Arjun',
      location: 'Chandigarh',
      date: 'March 2025',
      package: 'Heirloom',
    },
    {
      quote: "We didn't want a catalogue. We wanted our day. The baraat, the fire ritual, my father adjusting my dupatta — every frame feels like us.",
      couple: 'Ananya & Vikram',
      location: 'Udaipur',
      date: 'November 2024',
      package: 'Heirloom',
    },
    {
      quote: 'The farewell at the resort — my grandmother waving beside my father — is the photograph I will keep forever. Rohan sees the emotion before you know it\'s there.',
      couple: 'Meera & Rohit',
      location: 'New Chandigarh',
      date: 'February 2025',
      package: 'Essential',
    },
  ],

  /** Lightbox gallery order — must match data-lb indices in chapter frames */
  lightbox: [
    { src: 'images/B4.webp', jpg: 'images/B4.jpg', cap: 'Haldi Ceremony' },
    { src: 'images/B5.webp', jpg: 'images/B5.jpg', cap: 'Mehndi Ceremony' },
    { src: 'images/B14.webp', jpg: 'images/B14.jpg', cap: 'Mehndi Detail' },
    { src: 'images/B1.webp', jpg: 'images/B1.jpg', cap: 'A thousand memories' },
    { src: 'images/B2.webp', jpg: 'images/B2.jpg', cap: 'Golden Hour' },
    { src: 'images/B3.webp', jpg: 'images/B3.jpg', cap: 'The Gaze' },
    { src: 'images/B18.webp', jpg: 'images/B18.jpg', cap: 'Under the Mandap' },
    { src: 'images/B19.webp', jpg: 'images/B19.jpg', cap: 'What remains' },
    { src: 'images/B6.webp', jpg: 'images/B6.jpg', cap: 'Sisterhood' },
    { src: 'images/B7.webp', jpg: 'images/B7.jpg', cap: 'With Parents' },
    { src: 'images/B12.webp', jpg: 'images/B12.jpg', cap: "Father's Blessing" },
    { src: 'images/B13.webp', jpg: 'images/B13.jpg', cap: 'Family Blessing' },
    { src: 'images/B15.webp', jpg: 'images/B15.jpg', cap: 'Generations' },
    { src: 'images/B17.webp', jpg: 'images/B17.jpg', cap: "Grandfather's Joy" },
    { src: 'images/B20.webp', jpg: 'images/B20.jpg', cap: 'Getting Ready' },
    { src: 'images/B21.webp', jpg: 'images/B21.jpg', cap: 'Reunion' },
    { src: 'images/B23.webp', jpg: 'images/B23.jpg', cap: 'Courtyard Stories' },
    { src: 'images/B8.webp', jpg: 'images/B8.jpg', cap: 'Sacred Fire' },
    { src: 'images/B9.webp', jpg: 'images/B9.jpg', cap: 'The Sehra' },
    { src: 'images/B10.webp', jpg: 'images/B10.jpg', cap: 'The Baraat' },
    { src: 'images/B11.webp', jpg: 'images/B11.jpg', cap: 'Mandap Moment' },
    { src: 'images/B22.webp', jpg: 'images/B22.jpg', cap: 'Brotherhood' },
    { src: 'images/B16.webp', jpg: 'images/B16.jpg', cap: 'Until we meet again' },
  ],
};