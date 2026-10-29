import type { Exercise } from "../types";

// Library content. Images are Unsplash photo ids (rendered via `unsplash()`).
export const EXERCISES: Exercise[] = [
  {
    id: "ex-deadlift", name: "Barbell Deadlift", category: "strength", muscleGroups: ["Hamstrings", "Glutes", "Back"],
    equipment: "Barbell", difficulty: "Advanced", durationMin: 25, sets: 5, reps: 5, popularity: 2840,
    image: "1517836357463-d25dfeac3438",
    description: "The king of posterior-chain lifts. Brace hard, push the floor away and lock out with your glutes.",
  },
  {
    id: "ex-overhead-press", name: "Overhead Press", category: "strength", muscleGroups: ["Shoulders", "Triceps", "Core"],
    equipment: "Barbell", difficulty: "Intermediate", durationMin: 20, sets: 4, reps: 8, popularity: 1960,
    image: "1541534741688-6078c6bfb5c5",
    description: "Strict standing press for shoulder strength and a rock-solid trunk. Squeeze glutes, no leg drive.",
  },
  {
    id: "ex-core-stability", name: "Core Stability Series", category: "strength", muscleGroups: ["Core", "Abs"],
    equipment: "Mat", difficulty: "Beginner", durationMin: 15, sets: 3, reps: 15, popularity: 2620,
    image: "1571019613454-1cb2f99b2d8b",
    description: "Crunch, dead-bug and hollow-hold circuit that builds the anti-extension strength every sport needs.",
  },
  {
    id: "ex-pushup-circuit", name: "Dumbbell Push-Up Circuit", category: "strength", muscleGroups: ["Chest", "Triceps", "Core"],
    equipment: "Dumbbells", difficulty: "Beginner", durationMin: 15, sets: 3, reps: 15, popularity: 2210,
    image: "1594737625785-a6cbdabd333c",
    description: "Push-ups on dumbbell handles for extra range, finished with renegade rows.",
  },
  {
    id: "ex-db-row", name: "Single-Arm Dumbbell Row", category: "strength", muscleGroups: ["Back", "Biceps"],
    equipment: "Dumbbells", difficulty: "Intermediate", durationMin: 15, sets: 4, reps: 10, popularity: 1610,
    image: "1583454110551-21f2fa2afe61",
    description: "Builds a wide, strong back. Pull the elbow to the hip and pause at the top of every rep.",
  },
  {
    id: "ex-barbell-curl", name: "Barbell Curl Builder", category: "strength", muscleGroups: ["Biceps", "Forearms"],
    equipment: "Barbell", difficulty: "Beginner", durationMin: 15, sets: 3, reps: 12, popularity: 1420,
    image: "1581009146145-b5ef050c2e1e",
    description: "Controlled tempo curls with a three-second lowering phase for maximum time under tension.",
  },
  {
    id: "ex-romanian-deadlift", name: "Romanian Deadlift", category: "strength", muscleGroups: ["Hamstrings", "Glutes"],
    equipment: "Barbell", difficulty: "Intermediate", durationMin: 20, sets: 4, reps: 8, popularity: 1340,
    image: "1517963879433-6ad2b056d712",
    description: "Hip-hinge pattern that loads the hamstrings through a long range. Soft knees, flat back.",
  },
  {
    id: "ex-overhead-squat", name: "Overhead Squat", category: "strength", muscleGroups: ["Quads", "Glutes", "Shoulders"],
    equipment: "Barbell", difficulty: "Advanced", durationMin: 25, sets: 5, reps: 5, popularity: 980,
    image: "1508215885820-4585e56135c8",
    description: "A full-body test of mobility and stability. Keep the bar stacked over mid-foot.",
  },
  {
    id: "ex-stair-sprint", name: "Stair Sprint Climb", category: "cardio", muscleGroups: ["Quads", "Calves", "Glutes"],
    equipment: "Bodyweight", difficulty: "Intermediate", durationMin: 20, sets: 8, popularity: 1180,
    image: "1476480862126-209bfaa8edc8",
    description: "Eight hard climbs with walk-down recovery. Drives heart rate up and builds explosive legs.",
  },
  {
    id: "ex-stadium-lunges", name: "Stadium Step Lunges", category: "cardio", muscleGroups: ["Glutes", "Quads"],
    equipment: "Bodyweight", difficulty: "Beginner", durationMin: 15, sets: 3, reps: 12, popularity: 760,
    image: "1538805060514-97d9cc17730c",
    description: "Alternating step lunges up the bleachers — low impact, high burn.",
  },
  {
    id: "ex-bootcamp", name: "Outdoor Bootcamp", category: "cardio", muscleGroups: ["Full body"],
    equipment: "Bodyweight", difficulty: "Intermediate", durationMin: 40, popularity: 1530,
    image: "1607962837359-5e7e89f86776",
    description: "Group-style circuit of high knees, skips and shuttle runs. Bring a friend.",
  },
  {
    id: "ex-battle-ropes", name: "Battle Rope Intervals", category: "hiit", muscleGroups: ["Shoulders", "Core", "Arms"],
    equipment: "Battle ropes", difficulty: "Advanced", durationMin: 15, sets: 8, popularity: 1870,
    image: "1599058917212-d750089bc07e",
    description: "30 seconds on, 30 off. Alternating waves, slams and spirals for a full-body finisher.",
  },
  {
    id: "ex-rope-finisher", name: "Rope Wave Finisher", category: "hiit", muscleGroups: ["Shoulders", "Core"],
    equipment: "Battle ropes", difficulty: "Intermediate", durationMin: 10, sets: 6, popularity: 940,
    image: "1434596922112-19c563067271",
    description: "Short, brutal and effective. Six rounds to close out any strength session.",
  },
  {
    id: "ex-mat-hiit", name: "Mat HIIT Burner", category: "hiit", muscleGroups: ["Glutes", "Core"],
    equipment: "Mat", difficulty: "Beginner", durationMin: 20, sets: 4, popularity: 2050,
    image: "1518611012118-696072aa579a",
    description: "No-equipment Tabata blocks: kickbacks, mountain climbers and plank jacks.",
  },
  {
    id: "ex-vinyasa-flow", name: "Vinyasa Mobility Flow", category: "yoga", muscleGroups: ["Hamstrings", "Shoulders", "Spine"],
    equipment: "Mat", difficulty: "Beginner", durationMin: 25, popularity: 2380,
    image: "1600881333168-2ef49b341f30",
    description: "Breath-led flow that opens hips, hamstrings and thoracic spine after hard training days.",
  },
  {
    id: "ex-power-yoga", name: "Power Yoga Strength", category: "yoga", muscleGroups: ["Core", "Shoulders"],
    equipment: "Mat", difficulty: "Intermediate", durationMin: 30, popularity: 1270,
    image: "1599901860904-17e6ed7083a0",
    description: "Long holds and slow transitions that build strength through end ranges.",
  },
  {
    id: "ex-hip-opener", name: "Hip Opener Sequence", category: "yoga", muscleGroups: ["Hips", "Glutes"],
    equipment: "Mat", difficulty: "Intermediate", durationMin: 20, popularity: 1090,
    image: "1575052814086-f385e2e2ad1b",
    description: "Pigeon, lizard and king-arthur variations to undo hours of sitting.",
  },
  {
    id: "ex-easy-run", name: "Easy Road Run", category: "running", muscleGroups: ["Legs", "Cardio"],
    equipment: "Running shoes", difficulty: "Beginner", durationMin: 30, distanceKm: 5, popularity: 2970,
    image: "1486218119243-13883505764c",
    description: "Conversational-pace aerobic run. The foundation of every training plan.",
  },
  {
    id: "ex-tempo-run", name: "Sunset Tempo Run", category: "running", muscleGroups: ["Legs", "Cardio"],
    equipment: "Running shoes", difficulty: "Intermediate", durationMin: 35, distanceKm: 6.5, popularity: 1710,
    image: "1594882645126-14020914d58d",
    description: "20 minutes at comfortably-hard pace sandwiched by easy warm-up and cool-down.",
  },
  {
    id: "ex-sprint-starts", name: "Sprint Starts 10×60m", category: "running", muscleGroups: ["Quads", "Hamstrings", "Calves"],
    equipment: "Track", difficulty: "Advanced", durationMin: 30, sets: 10, distanceKm: 3, popularity: 1440,
    image: "1461896836934-ffe607ba8211",
    description: "Explosive block starts with full recovery. Quality over quantity.",
  },
  {
    id: "ex-track-repeats", name: "Track 400m Repeats", category: "running", muscleGroups: ["Legs", "Cardio"],
    equipment: "Track", difficulty: "Advanced", durationMin: 40, distanceKm: 6, popularity: 1150,
    image: "1502904550040-7534597429ae",
    description: "8 × 400m at 5K pace with 200m jog recoveries to sharpen speed.",
  },
  {
    id: "ex-hill-trail", name: "Hill Trail Run", category: "running", muscleGroups: ["Legs", "Glutes"],
    equipment: "Trail shoes", difficulty: "Intermediate", durationMin: 50, distanceKm: 8, popularity: 1320,
    image: "1530143311094-34d807799e8f",
    description: "Rolling terrain run that builds strength and ankle stability. Hike the steep bits.",
  },
  {
    id: "ex-night-run", name: "Night Group Run", category: "running", muscleGroups: ["Legs", "Cardio"],
    equipment: "Running shoes", difficulty: "Intermediate", durationMin: 45, distanceKm: 7.5, popularity: 890,
    image: "1552674605-db6ffd4facb5",
    description: "Steady city loop with the crew. Wear reflective gear.",
  },
  {
    id: "ex-group-ride", name: "Group Road Ride", category: "cycling", muscleGroups: ["Quads", "Glutes"],
    equipment: "Road bike", difficulty: "Intermediate", durationMin: 90, distanceKm: 40, popularity: 1260,
    image: "1517649763962-0c623066013b",
    description: "Paceline practice and steady endurance riding with the club.",
  },
  {
    id: "ex-spin-intervals", name: "Indoor Spin Intervals", category: "cycling", muscleGroups: ["Quads", "Cardio"],
    equipment: "Spin bike", difficulty: "Intermediate", durationMin: 30, distanceKm: 14, popularity: 1980,
    image: "1520877880798-5ee004e3f11e",
    description: "Six 3-minute threshold blocks. Rain-proof fitness.",
  },
  {
    id: "ex-zone2-ride", name: "Zone 2 Endurance Ride", category: "cycling", muscleGroups: ["Legs", "Cardio"],
    equipment: "Road bike", difficulty: "Beginner", durationMin: 60, distanceKm: 24, popularity: 830,
    image: "1485965120184-e220f721d03e",
    description: "Easy aerobic spin that grows your engine without the fatigue.",
  },
  {
    id: "ex-open-water", name: "Open Water Endurance Swim", category: "swimming", muscleGroups: ["Back", "Shoulders", "Cardio"],
    equipment: "Wetsuit", difficulty: "Intermediate", durationMin: 45, distanceKm: 2, popularity: 1240,
    image: "1438029071396-1e831a7fa6d8",
    description: "Continuous freestyle with sighting every 6–8 strokes. Race-specific practice for triathlon swims.",
  },
  {
    id: "ex-swim-technique", name: "Freestyle Technique Drills", category: "swimming", muscleGroups: ["Shoulders", "Core"],
    equipment: "Pool", difficulty: "Beginner", durationMin: 40, distanceKm: 1.5, popularity: 1660,
    image: "1530549387789-4c1017266635",
    description: "Catch-up, fingertip drag and 6-kick switch drills to build an efficient, relaxed stroke.",
  },
  {
    id: "ex-swim-intervals", name: "Threshold 100s", category: "swimming", muscleGroups: ["Back", "Shoulders", "Cardio"],
    equipment: "Pool", difficulty: "Advanced", durationMin: 50, sets: 15, distanceKm: 2.5, popularity: 970,
    image: "1622629797619-c100e3e67e2e",
    description: "15 × 100m at threshold pace with 15 seconds rest. Builds the speed you can hold all race.",
  },
  {
    id: "ex-breathwork", name: "Guided Breathwork", category: "recovery", muscleGroups: ["Mind", "Diaphragm"],
    equipment: "None", difficulty: "Beginner", durationMin: 10, popularity: 1490,
    image: "1506126613408-eca07ce68773",
    description: "Box breathing and long exhales to downshift your nervous system after training.",
  },
  {
    id: "ex-band-reset", name: "Band Mobility Reset", category: "recovery", muscleGroups: ["Shoulders", "Hips"],
    equipment: "Resistance bands", difficulty: "Beginner", durationMin: 15, popularity: 1120,
    image: "1584735935682-2f2b69dff9d2",
    description: "Pull-aparts, dislocates and banded hip distraction to restore range of motion.",
  },
];

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
