// Missing or invalid weights count as zero; ties retain the catalog order.
function projectWeight(project) {
  return Number.isFinite(project.weight) ? project.weight : 0;
}

function projectImage(project) {
  const destination = new URL(project.href, document.baseURI);
  return new URL('presentation-image.png', destination).href;
}

const grid = document.getElementById('project-grid');
const sortedProjects = [...showcaseProjects].sort((a, b) => projectWeight(b) - projectWeight(a));

for (const [index, project] of sortedProjects.entries()) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = project.href;
  card.style.setProperty('--hue', (index * 47 + 200) % 360);
  const media = document.createElement('div');
  media.className = 'card-media';
  media.setAttribute('aria-hidden', 'true');
  const monogram = document.createElement('span');
  monogram.className = 'card-monogram';
  monogram.textContent = project.title.split(/\s+/).slice(0, 2).map(word => word[0]).join('');
  media.append(monogram);
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => image.remove(), { once: true });
  image.src = projectImage(project);
  media.append(image);
  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h3');
  title.textContent = project.title;
  const action = document.createElement('span');
  action.className = 'card-action';
  action.textContent = 'Explore project';
  const arrow = document.createElement('span');
  arrow.className = 'card-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  action.append(arrow);
  body.append(title, action);
  card.append(media, body);
  grid.append(card);
}

document.getElementById('project-count').textContent = `${sortedProjects.length} projects`;
