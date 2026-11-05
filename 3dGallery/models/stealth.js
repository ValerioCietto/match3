// Mesh copied from 3dShooter/core.mjs; edit independently here.
export default {
  "id": "stealth",
  "name": "Stealth wing",
  "category": "Enemies",
  "description": "A thin triangular prism with a dark, low-profile hull.",
  "color": "#171e2c",
  "vertices": [
    [
      -0.433,
      -0.25,
      -0.06
    ],
    [
      0.433,
      -0.25,
      -0.06
    ],
    [
      0,
      0.5,
      -0.06
    ],
    [
      -0.433,
      -0.25,
      0.06
    ],
    [
      0.433,
      -0.25,
      0.06
    ],
    [
      0,
      0.5,
      0.06
    ]
  ],
  "faces": [
    [
      0,
      1,
      2
    ],
    [
      5,
      4,
      3
    ],
    [
      0,
      3,
      4,
      1
    ],
    [
      1,
      4,
      5,
      2
    ],
    [
      2,
      5,
      3,
      0
    ]
  ]
};
