/**
 * travelService.js
 * Generates mock travel options between a source and destination.
 */

const TRAVEL_OPTIONS = {
  train: [
    { name: 'Express Train', duration: '4h 30m', price: 350, class: 'Sleeper' },
    { name: 'Superfast Train', duration: '3h 45m', price: 650, class: 'AC 3-Tier' },
    { name: 'Rajdhani Express', duration: '3h 00m', price: 1200, class: 'AC 2-Tier' },
  ],
  bus: [
    { name: 'TNSTC Deluxe', duration: '5h 00m', price: 200, type: 'State Bus' },
    { name: 'AC Sleeper Bus', duration: '5h 30m', price: 550, type: 'Private' },
    { name: 'Volvo Multi-Axle', duration: '4h 45m', price: 750, type: 'Private AC' },
  ],
  flight: [
    { name: 'IndiGo', duration: '1h 05m', price: 3500, class: 'Economy' },
    { name: 'Air India', duration: '1h 10m', price: 4200, class: 'Economy' },
    { name: 'SpiceJet', duration: '1h 00m', price: 3000, class: 'Economy' },
  ],
};

const POPULAR_ROUTES = {
  'Chennai-Madurai': { distance: 461, highlight: 'Meenakshi Amman Temple, Thirumalai Nayakkar Palace' },
  'Chennai-Coimbatore': { distance: 503, highlight: 'Palani, Ooty gateway' },
  'Chennai-Trichy': { distance: 323, highlight: 'Brihadeeswarar Temple, Rock Fort' },
  'Chennai-Ooty': { distance: 540, highlight: 'Nilgiri Hills, Tea Gardens, Botanical Garden' },
  'Madurai-Rameswaram': { distance: 163, highlight: 'Ramanathaswamy Temple, Pamban Bridge' },
  'Coimbatore-Ooty': { distance: 86, highlight: 'Nilgiri Mountain Railway, Rose Garden' },
  'Chennai-Kanyakumari': { distance: 691, highlight: 'Vivekananda Rock Memorial, Thiruvalluvar Statue' },
  'Trichy-Tanjore': { distance: 57, highlight: 'Brihadeeswarar Temple, Saraswathi Mahal Library' },
};

function getTravelOptions(source, destination, budget = null) {
  const routeKey = `${toTitle(source)}-${toTitle(destination)}`;
  const reverseKey = `${toTitle(destination)}-${toTitle(source)}`;
  const routeInfo = POPULAR_ROUTES[routeKey] || POPULAR_ROUTES[reverseKey] || null;

  const src = toTitle(source) || 'City A';
  const dst = toTitle(destination) || 'City B';

  // Generate dynamic mock data based on source and destination
  let options = {
    train: [
      { name: `${src}-${dst} Express`, duration: '5h 30m', price: 400, class: 'Sleeper' },
      { name: `${src} Superfast`, duration: '4h 15m', price: 750, class: 'AC 3-Tier' },
      { name: `Vande Bharat (${src}-${dst})`, duration: '3h 30m', price: 1300, class: 'CC' },
    ],
    bus: [
      { name: `TNSTC (${src} to ${dst})`, duration: '6h 00m', price: 250, type: 'State Bus' },
      { name: 'AC Sleeper Travels', duration: '5h 45m', price: 600, type: 'Private' },
      { name: 'Volvo Multi-Axle', duration: '5h 00m', price: 850, type: 'Private AC' },
    ],
    flight: [
      { name: `IndiGo (${src}-${dst})`, duration: '1h 15m', price: 3800, class: 'Economy' },
      { name: 'Air India', duration: '1h 20m', price: 4500, class: 'Economy' },
    ],
  };

  // Specific overrides for the routes requested by user
  const isRoute = (a, b) => (src.toLowerCase() === a.toLowerCase() && dst.toLowerCase() === b.toLowerCase()) || 
                            (src.toLowerCase() === b.toLowerCase() && dst.toLowerCase() === a.toLowerCase());

  if (isRoute('Chennai', 'Coimbatore')) {
    options.train[0] = { name: 'Cheran Express', duration: '8h 00m', price: 450, class: 'Sleeper' };
    options.train[1] = { name: 'Kovai Express', duration: '7h 30m', price: 700, class: 'CC' };
    options.train[2] = { name: 'Vande Bharat (Chennai-Coimbatore)', duration: '5h 50m', price: 1365, class: 'CC' };
    options.flight[0] = { name: 'IndiGo (MAA-CJB)', duration: '1h 05m', price: 3500, class: 'Economy' };
  } else if (isRoute('Chennai', 'Theni')) {
    options.train = [
      { name: 'Theni Express (via Madurai)', duration: '10h 30m', price: 420, class: 'Sleeper' },
    ];
    options.bus[0] = { name: 'SETC Ultra Deluxe (Chennai-Theni)', duration: '10h 00m', price: 550, type: 'State Bus' };
    options.flight = []; // No direct flight to Theni
  } else if (isRoute('Chennai', 'Thanjavur') || isRoute('Chennai', 'Thanjaur')) {
    options.train[0] = { name: 'Uzhavan Express', duration: '7h 00m', price: 340, class: 'Sleeper' };
    options.train[1] = { name: 'Chozhan Express', duration: '7h 30m', price: 400, class: '2S' };
    options.flight = []; // No direct flight to Thanjavur (Trichy is nearest)
  } else if (isRoute('Chennai', 'Mumbai')) {
    options.train[0] = { name: 'Mumbai Mail', duration: '24h 00m', price: 800, class: 'Sleeper' };
    options.bus = [{ name: 'VRL Travels', duration: '22h 00m', price: 1800, type: 'Sleeper AC' }];
    options.flight[0] = { name: 'Air India (MAA-BOM)', duration: '2h 00m', price: 4200, class: 'Economy' };
  } else if (isRoute('Chennai', 'Bangalore') || isRoute('Chennai', 'Bengaluru')) {
    options.train[0] = { name: 'Shatabdi Express', duration: '5h 00m', price: 1100, class: 'CC' };
    options.train[1] = { name: 'Brindavan Express', duration: '6h 00m', price: 200, class: '2S' };
    options.bus[0] = { name: 'KSRTC Airavat', duration: '6h 30m', price: 800, type: 'Volvo AC' };
    options.flight[0] = { name: 'SpiceJet', duration: '0h 55m', price: 2500, class: 'Economy' };
  }

  // Filter by budget
  if (budget === 'low') {
    options.train = options.train.filter(t => t.price <= 500);
    options.bus = options.bus.filter(b => b.price <= 300);
    options.flight = [];
  } else if (budget === 'medium') {
    options.train = options.train.filter(t => t.price <= 800);
    options.bus = options.bus.filter(b => b.price <= 600);
    options.flight = options.flight.filter(f => f.price <= 4000);
  }

  return {
    source: src || 'Unknown',
    destination: dst || 'Unknown',
    routeInfo,
    options,
  };
}

function toTitle(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = { getTravelOptions };
