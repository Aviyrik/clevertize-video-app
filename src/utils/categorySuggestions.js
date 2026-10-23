/**
 * Category-Specific Brief Suggestions & Placeholders
 * Provides culturally grounded, authentic, industry-tailored creative ideas for local businesses and brands.
 */

export function getCategoryBriefSuggestions(businessType, businessName, town, offer) {
  const brand = (businessName && businessName.trim()) || 'your brand';
  const city = (town && town.trim()) || '';
  const citySuffix = city ? ` in ${city}` : '';
  const bType = (businessType || '').toLowerCase();

  // 1. Healthcare, Clinic, Pharmacy & Medical (High Priority - protects against 'care' substring collisions)
  if (
    bType.includes('health') ||
    bType.includes('clinic') ||
    bType.includes('pharmacy') ||
    bType.includes('doctor') ||
    bType.includes('hospital') ||
    bType.includes('medical') ||
    bType.includes('dental') ||
    bType.includes('chemist') ||
    bType.includes('medicine') ||
    bType.includes('practo') ||
    bType.includes('diagnostic') ||
    bType.includes('pathology') ||
    bType.includes('consultation') ||
    bType.includes('telehealth') ||
    bType.includes('pediatric')
  ) {
    return {
      placeholder: `e.g. Show why patients trust ${brand}${citySuffix} for verified doctor consultations, instant video appointments, and express medicine delivery. Highlight certified specialists, zero waiting, and caring support...`,
      suggestions: [
        `Book a verified specialist consultation in 2 minutes with top doctors across 25+ specialties`,
        `Skip long clinic queues — get instant online doctor video consultations from home on ${brand}`,
        `Promote complete family preventive health checkup and lab tests with free home sample pickup`,
        `Highlight 100% genuine medicines delivered directly to your doorstep with guaranteed savings`,
        `Show a caring doctor patiently listening to a worried parent and easing their anxiety`,
        `Overcome hesitation and doctor anxiety with gentle, modern technology and transparent care`,
      ],
    };
  }

  // 2. Jewellery & Accessories
  if (bType.includes('jewel') || bType.includes('gold') || bType.includes('ornament') || bType.includes('diamond') || bType.includes('silver')) {
    return {
      placeholder: `e.g. Announce our festive gold and diamond collection at ${brand}${citySuffix}. Emphasize 100% BIS hallmark 916 purity, exquisite craftsmanship, and 0% making charges offer...`,
      suggestions: [
        `Highlight hallmark 916 gold & diamond lightweight jewellery for festive occasions`,
        `Show a heartwarming story of a husband surprising his wife with a delicate necklace`,
        `Announce 0% making charges offer on antique temple jewellery this wedding season`,
        `Promote daily wear rose gold and silver ornaments that match every modern outfit`,
        `Exchange old gold for brand-new hallmarked designer jewellery with maximum value`,
        `Show a daughter choosing heirloom bridal jewellery with her parents for the wedding`,
      ],
    };
  }

  // 3. Sarees, Ethnic & Bridal Wear
  if (bType.includes('saree') || bType.includes('ethnic') || bType.includes('bridal') || bType.includes('lehenga') || bType.includes('silk')) {
    return {
      placeholder: `e.g. Show why ${brand} is the top destination for wedding & festive sarees${citySuffix}. Highlight authentic handloom silks, intricate zardozi borders, and special bridal styling assistance...`,
      suggestions: [
        `Showcase our new pure Kanjivaram & Banarasi bridal saree collection for wedding season`,
        `Create a fun festive video highlighting special discount on designer partywear sarees`,
        `Show a daughter helping her mother choose the perfect silk saree at ${brand}`,
        `Highlight our handloom lightweight daily wear and office sarees with modern prints`,
        `Promote exclusive festive bridal lehenga collection with personalized fitting`,
      ],
    };
  }

  // 4. Clothing & Fashion Apparel
  if (bType.includes('clothing') || bType.includes('apparel') || bType.includes('fashion') || bType.includes('boutique') || bType.includes('tailor')) {
    return {
      placeholder: `e.g. Launch our new seasonal clothing collection at ${brand}${citySuffix}. Highlight premium cotton fabrics, flattering fits, and trendsetting styles for every occasion...`,
      suggestions: [
        `Launch our new festive ethnic and western collection with trending outfits`,
        `Create a relatable Reel comparing online fitting disappointments vs perfect trial at ${brand}`,
        `Showcase Buy 2 Get 1 Free festive sale on trending outfits`,
        `Show college students finding stylish, budget-friendly everyday fits`,
        `Highlight premium breathable fabrics and custom tailoring for the festive season`,
      ],
    };
  }

  // 5. Sweets, Bakery & Confectionery
  if (bType.includes('sweet') || bType.includes('bakery') || bType.includes('mithai') || bType.includes('cake') || bType.includes('snack')) {
    return {
      placeholder: `e.g. Create a festive video for ${brand}${citySuffix} highlighting pure desi ghee sweets, fresh customized gift hampers, and guaranteed same-day delivery...`,
      suggestions: [
        `Show fresh pure desi ghee sweets being packed into premium festive gift hampers`,
        `Create a funny family video about sneaking the last piece of Kaju Katli from the box`,
        `Announce special festival gift boxes and same-day delivery for corporate orders`,
        `Highlight our famous signature sweets made fresh every morning with 100% purity`,
        `Showcase custom birthday cakes and oven-fresh bakery treats made with love`,
      ],
    };
  }

  // 6. Restaurants, Cafes & Dining
  if (bType.includes('restaurant') || bType.includes('cafe') || bType.includes('kitchen') || bType.includes('food') || bType.includes('dining') || bType.includes('diner') || bType.includes('hotel')) {
    return {
      placeholder: `e.g. Show why food lovers visit ${brand}${citySuffix} for authentic flavors, warm cozy ambience, and unbeatable weekend dining specials...`,
      suggestions: [
        `Showcase our sizzling signature dishes and warm family dining ambience`,
        `Create a fun video of friends arguing over who gets the last bite of our special platter`,
        `Promote our weekend unlimited buffet and special discount on online orders`,
        `Highlight authentic regional recipes crafted with traditional slow-cooked spices`,
        `Show a cozy candlelit dinner celebration with decadent desserts`,
      ],
    };
  }

  // 7. Kirana, Supermarkets & Grocery
  if (bType.includes('kirana') || bType.includes('grocery') || bType.includes('supermarket') || (bType.includes('mart') && !bType.includes('smart')) || bType.includes('provisions')) {
    return {
      placeholder: `e.g. Show why local families trust ${brand}${citySuffix} for monthly grocery shopping, farm-fresh produce, and 30-minute free home delivery...`,
      suggestions: [
        `Show why neighbours trust ${brand} for monthly groceries with instant free delivery`,
        `Relatable video of a husband remembering forgotten grocery items via a quick WhatsApp list`,
        `Promote special festive discounts on cooking oil, staples, and dry fruit packs`,
        `Highlight fresh daily morning arrivals and better-than-online prices on essentials`,
      ],
    };
  }

  // 8. Salon, Parlour & Spa
  if (bType.includes('salon') || bType.includes('parlour') || bType.includes('spa') || bType.includes('beauty') || bType.includes('hair')) {
    return {
      placeholder: `e.g. Promote our festive makeover and bridal packages at ${brand}${citySuffix}. Highlight certified hair stylists, relaxing ambience, and glowing transformations...`,
      suggestions: [
        `Show a stunning bridal makeup and pre-wedding glow transformation at ${brand}`,
        `Highlight our festive head-to-toe beauty package at flat 40% discount`,
        `Relatable video on busy professionals taking a relaxing weekend pampering spa day`,
        `Promote advanced skin treatments and organic hair spa with expert stylists`,
      ],
    };
  }

  // 9. Skincare, Cosmetics & Wellness
  if (bType.includes('skin') || bType.includes('cosmetic') || bType.includes('wellness') || bType.includes('ayurveda') || bType.includes('derma')) {
    return {
      placeholder: `e.g. Introduce our clean, chemical-free skincare formulas from ${brand}. Focus on natural glowing skin, visible transformation in 14 days, and dermatologist approval...`,
      suggestions: [
        `Demonstrate our gentle ayurvedic glow serum clearing dullness naturally`,
        `Customer testimonial Reel showing visible skin glow without harsh chemicals`,
        `Launch our festive skincare combo gift kit with exclusive limited-period gift`,
        `Highlight dermatologically tested, clean formulations crafted for Indian skin`,
      ],
    };
  }

  // 10. Mobile, Electronics & Appliances
  if (((bType.includes('mobile') && !bType.includes('auto')) || bType.includes('smartphone') || bType.includes('laptop') || bType.includes('electronics') || bType.includes('appliance') || bType.includes('gadget'))) {
    return {
      placeholder: `e.g. Show why purchasing gadgets at ${brand}${citySuffix} gives instant setup, best exchange bonus, and zero-cost EMI plans...`,
      suggestions: [
        `Show why buying phones offline at ${brand} beats online delivery with instant setup`,
        `Promote festive exchange bonanza with up to ₹10,000 off on 5G smartphones`,
        `Relatable story of upgrading parents to a smooth smartphone with friendly guidance`,
        `Highlight zero down-payment EMI offers and genuine manufacturer warranties`,
      ],
    };
  }

  // 11. Home Decor, Furniture & Interior
  if (bType.includes('decor') || bType.includes('furniture') || bType.includes('modular') || bType.includes('interior') || bType.includes('furnishing')) {
    return {
      placeholder: `e.g. Show why ${brand} is the smart choice for interior makeovers${citySuffix}. Highlight modular space-saving designs, premium materials, and 10-year warranty...`,
      suggestions: [
        `Show how our modular kitchen maximizes space for compact modern apartments`,
        `Highlight durable solid teakwood dining and living room sets with 10-year warranty`,
        `Create a cozy festive home makeover Reel with designer lighting and curtains`,
        `Promote free 3D design layout and turnkey interior installation`,
      ],
    };
  }

  // 12. Real Estate, Builders & Properties
  if (bType.includes('real estate') || bType.includes('builder') || bType.includes('property') || bType.includes('developer')) {
    return {
      placeholder: `e.g. Tour the luxury lifestyle and prime connectivity at ${brand}${citySuffix}. Showcase modern amenities, green surroundings, and attractive payment plans...`,
      suggestions: [
        `Show walkthrough of ready-to-move spacious apartments with scenic balconies`,
        `Highlight prime location with 5-minute connectivity to metro, schools, and tech parks`,
        `Promote festive booking offer with zero registration charges and modular kitchen`,
        `Showcase luxury gated community amenities with clubhouse, pool, and 24/7 security`,
      ],
    };
  }

  // 13. Education, Coaching & Tuition
  if (
    bType.includes('education') ||
    bType.includes('coaching') ||
    bType.includes('tuition') ||
    bType.includes('school') ||
    bType.includes('academy') ||
    bType.includes('institute') ||
    bType.includes('class') ||
    bType.includes('learning') ||
    bType.includes('training')
  ) {
    return {
      placeholder: `e.g. Show how students achieve top results and concept clarity at ${brand}${citySuffix}. Highlight experienced faculty, structured mock tests, and personalized mentoring...`,
      suggestions: [
        `Show students achieving top exam scores with personalized coaching and expert faculty at ${brand}`,
        `Promote free interactive demo classes and early-bird scholarship for new academic batches`,
        `Highlight structured concept clearing and doubt-solving sessions that build real exam confidence`,
        `Share an inspiring student transformation story from exam fear to school topper`,
      ],
    };
  }

  // 14. Fitness, Gym & Yoga
  if (bType.includes('gym') || bType.includes('fitness') || bType.includes('yoga') || bType.includes('workout')) {
    return {
      placeholder: `e.g. Inspire fitness enthusiasts to join ${brand}${citySuffix}. Highlight imported equipment, certified personal trainers, and motivating community culture...`,
      suggestions: [
        `Inspire people to start their transformation journey with expert certified trainers`,
        `Promote annual membership festive discount with free personalized diet plan`,
        `Show an energetic group workout session and welcoming community vibe`,
        `Highlight modern imported equipment, clean locker rooms, and flexible timings`,
      ],
    };
  }

  // 15. Automobile, Bikes & Garage Services (Strictly check non-care words to prevent collision with 'healthcare' or 'skincare')
  const isAutomobile =
    (bType.includes('auto') ||
      bType.includes('bike') ||
      bType.includes('garage') ||
      bType.includes('mechanic') ||
      bType.includes('motor') ||
      /\b(cars?|vehicles?|motorcycles?|scooters?|dealership|detailing)\b/i.test(bType)) &&
    !bType.includes('care');

  if (isAutomobile) {
    return {
      placeholder: `e.g. Highlight festive delivery offers at ${brand}${citySuffix}. Show express service turnaround, genuine spare parts, and exciting exchange bonuses...`,
      suggestions: [
        `Show a family joyfully taking delivery of their shiny new vehicle for the festival`,
        `Promote bumper-to-bumper car detailing, ceramic coating, and AC service package`,
        `Highlight easy exchange schemes and lowest interest EMI financing on two-wheelers`,
        `Showcase quick 60-minute express periodic servicing with genuine parts`,
      ],
    };
  }

  // Universal fallback tailored to brand name and city
  return {
    placeholder: `e.g. Announce your special festive offer or showcase why customers choose ${brand}${citySuffix}. Highlight your unique craftsmanship and benefits...`,
    suggestions: [
      `Show why customers choose ${brand} for trusted quality and personalized service`,
      `Create a relatable commercial highlighting our special offer and fast delivery`,
      `Tell the authentic story behind our craft, dedication, and happy patrons`,
      `Demonstrate how ${brand} solves everyday customer dilemmas with ease and care`,
    ],
  };
}

export function getBriefSuggestions(businessType, businessName, town, offer) {
  try {
    return getCategoryBriefSuggestions(businessType, businessName, town, offer) || {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
        'Tell the authentic story behind our craft, dedication, and happy patrons',
        'Demonstrate how our brand solves everyday customer dilemmas with ease and care',
      ],
    };
  } catch (err) {
    console.warn('[getBriefSuggestions] fallback on error:', err);
    return {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
        'Tell the authentic story behind our craft, dedication, and happy patrons',
        'Demonstrate how our brand solves everyday customer dilemmas with ease and care',
      ],
    };
  }
}
