// Hull vertices and faces from 3dShooter/game.js. Exhaust is a flight effect.
export default {
  id: 'player', name: 'Void Wing', category: 'Ships', color: '#597786',
  description: 'The player starship. A swept-wing hull built from three polygon faces.',
  vertices: [[0,.2,2.7],[-1.9,-.1,-1.3],[0,.6,-.7],[1.9,-.1,-1.3],[0,-.3,-1.8]],
  faces: [[0,1,2],[0,2,3],[1,4,3,2]],
  faceColors: ['#597786','#284b61','#233a52']
};
