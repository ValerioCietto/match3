// Mesh copied from 3dShooter/core.mjs; edit independently here.
export default {
  "id": "normal",
  "name": "Standard fighter",
  "category": "Enemies",
  "description": "The standard enemy: a cube rotated 45 degrees around its forward axis.",
  "color": "#8b96a9",
  "vertices": [
    [
      0,
      -0.7071067811865475,
      -0.5
    ],
    [
      0.7071067811865475,
      0,
      -0.5
    ],
    [
      -0.7071067811865475,
      0,
      -0.5
    ],
    [
      0,
      0.7071067811865475,
      -0.5
    ],
    [
      0,
      -0.7071067811865475,
      0.5
    ],
    [
      0.7071067811865475,
      0,
      0.5
    ],
    [
      -0.7071067811865475,
      0,
      0.5
    ],
    [
      0,
      0.7071067811865475,
      0.5
    ]
  ],
  "faces": [
    [
      0,
      1,
      3,
      2
    ],
    [
      4,
      6,
      7,
      5
    ],
    [
      0,
      4,
      5,
      1
    ],
    [
      2,
      3,
      7,
      6
    ],
    [
      0,
      2,
      6,
      4
    ],
    [
      1,
      5,
      7,
      3
    ]
  ]
};
