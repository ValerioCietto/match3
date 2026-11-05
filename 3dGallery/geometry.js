export function edgesOf(model) {
  const edges = new Map();
  for (const face of model.faces) face.forEach((a, i) => {
    const b = face[(i + 1) % face.length];
    edges.set([a, b].sort((x, y) => x - y).join(','), [a, b]);
  });
  return [...edges.values()];
}

export function normalize(model) {
  const min = [0,1,2].map(axis => Math.min(...model.vertices.map(v => v[axis])));
  const max = [0,1,2].map(axis => Math.max(...model.vertices.map(v => v[axis])));
  const center = min.map((value, axis) => (value + max[axis]) / 2);
  const radius = Math.max(...model.vertices.map(v => Math.hypot(...v.map((n,i) => n-center[i])))) || 1;
  return model.vertices.map(v => v.map((n,i) => (n-center[i])/radius));
}

export function rotate([x,y,z], yaw, pitch) {
  const rx = x*Math.cos(yaw) + z*Math.sin(yaw);
  const rz = -x*Math.sin(yaw) + z*Math.cos(yaw);
  return [rx, y*Math.cos(pitch)-rz*Math.sin(pitch), y*Math.sin(pitch)+rz*Math.cos(pitch)];
}
