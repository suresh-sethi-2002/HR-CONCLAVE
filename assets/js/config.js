const branding = 'assets/images/branding/';
const previousPhoto = 'assets/images/hero/HERO BG IAMEGS.jpg';
const campusQuery = 'Gandhi Institute of Excellent Technocrats, Santi Niketan, Ghangapatana, Kantabada, Bhubaneswar, Odisha 752054';

export const config = {
  event: {
    title: 'HR CONCLAVE 2026',
    year: '2026',
    theme: 'Teach Meets Talent: Shaping the Workforce of Tomorrow',
    date: 'To Be Announced',
    venue: 'To Be Announced',
    organizer: 'GIET, Ghangapatna'
  },
  logo: {
    giet: branding + '1. GIET LOGO.png',
    conclave: branding + '2. HR LOGO.png',
    naac: branding + '3. NAAC LOGO.png',
    nba: branding + '4. nba.png',
    siro: branding + '5. DSIR Recognized SIRO Seal.png',
    wordmark: branding + '6. GIET TEXT LOGO.png'
  },
  highlightsPhoto: previousPhoto,
  heroImage: previousPhoto,
  heroCaption: 'From HR Conclave 2025',
  contact: { name: '', email: '' },
  campus: {
    address: campusQuery,
    phone: '+91 000-000-0000',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4299.685039610264!2d85.72094828724299!3d20.288641640872246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19077849f9fba1%3A0xa943079bb639666!2sGandhi%20Institute%20of%20Excellent%20Technocrats%20GIET%20Bhubaneswar%20Odisha!5e1!3m2!1sen!2sin!4v1794980657669!5m2!1sen!2sin'
  },
  links: {
    website: 'https://www.gietbbsr.edu.in/',
    linkedin: 'https://www.linkedin.com/company/gandhi-institute-of-excellent-technocrats/',
    instagram: 'https://www.instagram.com/gietghangapatnaofficial/',
    facebook: 'https://www.facebook.com/gietbbsrofficial',
    youtube: 'https://www.youtube.com/@G.I.E.TGhangapatna',
    maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(campusQuery)
  },
  editions: [{
    year: '2025',
    title: 'HR Conclave 2025',
    description: 'Revisit GIET’s 2025 edition, including its speaker lineup, panel topics and event photographs.',
    photo: previousPhoto,
    alt: 'Attendees pose for a group photograph at HR Conclave 2025',
    url: 'https://www.gietbbsr.edu.in/page/hr-conclave-2025',
    linkLabel: 'Visit the 2025 event page'
  }],
  galleryEnabled: false,
  contentUrl: 'data/demo-content.json',
  notices: {
    mode: 'live', // 'demo' or 'live'
    apiUrl: 'https://script.google.com/macros/s/AKfycbx264d_P3SgcTHJHUwwLPuh9-pNyc7cMiPBeGpNMlp0snhC2KPOmucZGoznNQCh-I3q/exec',
    refreshMs: 5 * 60 * 1000,
    timeoutMs: 12000
  }
};
