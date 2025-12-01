export const FIXTURES = [
  {
    id: "chauvet_r2_spot",
    brand: "Chauvet",
    name: "R2 Spot",
    defaultVoltage: 120,
    modes: [
      { name: "Basic", channels: 18, powerWatts: 240 },
      { name: "Extended", channels: 21, powerWatts: 240 },
    ],
  },
  {
    id: "chauvet_r3_wash",
    brand: "Chauvet",
    name: "R3 Wash",
    defaultVoltage: 120,
    modes: [
      { name: "Basic", channels: 21, powerWatts: 660 },
      { name: "Detailed", channels: 62, powerWatts: 660 },
      { name: "Expanded", channels: 71, powerWatts: 660 },
      { name: "Complex", channels: 107, powerWatts: 660 },
    ],
  },
  {
    id: "astera_hyperion_tube",
    brand: "Astera",
    name: "Hyperion Tube",
    defaultVoltage: 120,
    modes: [
      { name: "Pixel", channels: 3, powerWatts: 92 },
      { name: "DIM RGBAW DIM RGBAW", channels: 48, powerWatts: 92 },
      { name: "EFFECT MODE RGB", channels: 255, powerWatts: 92 },
    ],
  },
  {
    id: "chauvet_r2x_beam",
    brand: "Chauvet",
    name: "R2X Beam",
    defaultVoltage: 120,
    modes: [
      { name: "Simple", channels: 15, powerWatts: 413 },
      { name: "Expanded", channels: 18, powerWatts: 413 },
    ],
  },
  {
    id: "elation_sixpar_200",
    brand: "Elation",
    name: "Sixpar 200",
    defaultVoltage: 120,
    modes: [
      { name: "6-ch RGBW", channels: 6, powerWatts: 150 },
      { name: "7-ch RGBW", channels: 7, powerWatts: 150 },
      { name: "8-ch RGBW", channels: 8, powerWatts: 150 },
      { name: "12-ch RGBW", channels: 12, powerWatts: 150 },
    ],
  },
];
