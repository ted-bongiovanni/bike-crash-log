import type Database from "better-sqlite3";

const COMMUTE_SEED_DATA = [
  { date: "2026-03-17", weather: 3, safety: 2, legs: 4, soul: 3, notes: "First warm-ish day. Saw a hawk on the Williamsburg Bridge. Delivery truck parked in the bike lane on Grand. Again." },
  { date: "2026-03-14", weather: 2, safety: 3, legs: 2, soul: 2, notes: "Nobody honked at me today. Low bar, but still. Rain the entire way. Glasses fogged. Soul damp." },
  { date: "2026-03-13", weather: 4, safety: 4, legs: 3, soul: 5, notes: "Perfect tailwind on the bridge. Coffee shop had my order ready. Life is good." },
  { date: "2026-03-12", weather: 1, safety: 2, legs: 3, soul: 1, notes: "Sleet. Actual sleet in March. Cab cut me off on 2nd Ave. Existential dread." },
  { date: "2026-03-11", weather: 3, safety: 3, legs: 4, soul: 4, notes: "Old guy on a fixie gave me a nod. Solidarity. Construction detour added 10 minutes." },
  { date: "2026-03-10", weather: 4, safety: 1, legs: 5, soul: 2, notes: "Legs felt incredible. Must be the new saddle. Three near-misses in 20 minutes. Driver ran a red on Houston. Another on Delancey. Bike lane blocked on Allen." },
  { date: "2026-03-07", weather: 5, safety: 4, legs: 3, soul: 5, notes: "Gorgeous morning. Sunrise over the East River. Sang out loud on the bridge. Glass in the bike lane on Kent Ave. Per tradition." },
  { date: "2026-03-06", weather: 2, safety: 3, legs: 2, soul: 3, notes: "Found a dollar on the ground at a red light. Headwind both directions. How is that even possible." },
  { date: "2026-03-05", weather: 3, safety: 4, legs: 4, soul: 4, notes: "Smooth ride. Green lights the whole way down 1st Ave. Pedestrian yelled at me for existing in the bike lane." },
  { date: "2026-03-04", weather: 4, safety: 2, legs: 3, soul: 2, notes: "Nice weather at least. Door zone roulette on Smith St. Someone opened a door into the lane, missed me by inches." },
  { date: "2026-03-03", weather: 1, safety: 3, legs: 1, soul: 1, notes: "Cold rain. Forgot gloves. Hands numb by mile 2. Questioned every life choice." },
  { date: "2026-02-28", weather: 3, safety: 5, legs: 4, soul: 5, notes: "Protected bike lane on the new stretch of Queens Blvd. Felt like cycling in Copenhagen. Also a dog ran alongside me for a block, very motivating." },
];

const SEED_DATA = [
  { lat: 40.7580, lng: -73.9855, location_description: "7th Ave & W 47th St", description: "Car turned right without checking bike lane. Had to brake hard and went over handlebars.", severity: "moderate", crash_type: "vehicle", date_of_crash: "2026-02-15", reported_to_police: 0 },
  { lat: 40.7282, lng: -73.7949, location_description: "Union Turnpike & Queens Blvd", description: "Hit a deep pothole hidden by standing water. Front wheel buckled.", severity: "moderate", crash_type: "road_hazard", date_of_crash: "2026-02-10", reported_to_police: 0 },
  { lat: 40.6892, lng: -73.9857, location_description: "Atlantic Ave & Court St", description: "Passenger opened car door directly into bike lane. Clipped the door edge.", severity: "severe", crash_type: "dooring", date_of_crash: "2026-01-28", reported_to_police: 1 },
  { lat: 40.7484, lng: -73.9857, location_description: "5th Ave & 34th St", description: "Wet metal grate caused rear wheel to slide out. Low-speed fall.", severity: "minor", crash_type: "road_hazard", date_of_crash: "2026-01-20", reported_to_police: 0 },
  { lat: 40.7614, lng: -73.9776, location_description: "E 53rd St & Madison Ave", description: "Delivery truck cut into bike lane. Swerved and hit curb.", severity: "minor", crash_type: "vehicle", date_of_crash: "2026-01-15", reported_to_police: 0 },
  { lat: 40.7128, lng: -74.0060, location_description: "Broadway & Fulton St", description: "Pedestrian stepped into bike lane looking at phone. Both went down.", severity: "moderate", crash_type: "pedestrian", date_of_crash: "2025-12-18", reported_to_police: 0 },
  { lat: 40.7831, lng: -73.9712, location_description: "Central Park West & W 81st St", description: "Chain snapped on a climb. Lost balance and fell.", severity: "minor", crash_type: "solo", date_of_crash: "2025-12-05", reported_to_police: 0 },
  { lat: 40.6782, lng: -73.9442, location_description: "Washington Ave & Eastern Pkwy", description: "SUV ran red light at intersection. Had to lay bike down to avoid.", severity: "severe", crash_type: "vehicle", date_of_crash: "2025-11-22", reported_to_police: 1 },
  { lat: 40.7505, lng: -73.9934, location_description: "9th Ave & W 33rd St", description: "Glass debris in bike lane from broken bottle. Flat tire and skid.", severity: "minor", crash_type: "road_hazard", date_of_crash: "2025-11-10", reported_to_police: 0 },
  { lat: 40.6860, lng: -73.9418, location_description: "Classon Ave & Park Pl", description: "Uber driver stopped suddenly in bike lane to pick up passenger. Rear-ended the car.", severity: "moderate", crash_type: "vehicle", date_of_crash: "2025-10-30", reported_to_police: 0 },
  { lat: 40.7359, lng: -73.9911, location_description: "6th Ave & W 14th St", description: "Double-parked van forced merge into traffic. Car honked and swerved into me.", severity: "severe", crash_type: "vehicle", date_of_crash: "2025-10-15", reported_to_police: 1 },
  { lat: 40.7069, lng: -73.9973, location_description: "Chambers St & West St", description: "Slipped on wet paint markings during rain. Low-side crash.", severity: "minor", crash_type: "solo", date_of_crash: "2025-09-20", reported_to_police: 0 },
];

export function seedDatabase(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as count FROM crashes").get() as { count: number }).count;

  if (count === 0) {
    const stmt = db.prepare(`
      INSERT INTO crashes (lat, lng, location_description, description, severity, crash_type, date_of_crash, reported_to_police)
      VALUES (@lat, @lng, @location_description, @description, @severity, @crash_type, @date_of_crash, @reported_to_police)
    `);

    const insertAll = db.transaction(() => {
      for (const crash of SEED_DATA) {
        stmt.run(crash);
      }
    });

    insertAll();
    console.log(`Seeded ${SEED_DATA.length} crashes`);
  }

  // Seed commute logs
  const commuteCount = (db.prepare("SELECT COUNT(*) as count FROM commute_logs").get() as { count: number }).count;

  if (commuteCount === 0) {
    const commuteStmt = db.prepare(`
      INSERT INTO commute_logs (date, weather, safety, legs, soul, notes)
      VALUES (@date, @weather, @safety, @legs, @soul, @notes)
    `);

    const insertCommutes = db.transaction(() => {
      for (const log of COMMUTE_SEED_DATA) {
        commuteStmt.run(log);
      }
    });

    insertCommutes();
    console.log(`Seeded ${COMMUTE_SEED_DATA.length} commute logs`);
  }
}
