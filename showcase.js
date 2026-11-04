// Missing or invalid weights count as zero; ties retain the catalog order.
function projectWeight(project) {
  return Number.isFinite(project.weight) ? project.weight : 0;
}

function projectImage(project) {
  const destination = new URL(project.href, document.baseURI);
  return new URL('presentation-image.png', destination).href;
}

const grid = document.getElementById('project-grid');
const quizGrid = document.getElementById('quiz-grid');
const sortedProjects = [...showcaseProjects].sort((a, b) => projectWeight(b) - projectWeight(a));

for (const [index, project] of sortedProjects.entries()) {
  const hasVersions = Array.isArray(project.versions) && project.versions.length > 0;
  const card = document.createElement(hasVersions ? 'article' : 'a');
  card.className = 'card';
  if (!hasVersions) card.href = project.href;
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
  const actions = document.createElement('div');
  actions.className = hasVersions ? 'card-links' : 'card-links card-links-single';
  for (const version of hasVersions ? project.versions : [{ label: 'Explore project' }]) {
    const action = document.createElement(hasVersions ? 'a' : 'span');
    action.className = 'card-action';
    action.textContent = version.label;
    if (hasVersions) {
      action.href = version.href;
      action.setAttribute('aria-label', `${project.title}: ${version.label}`);
    }
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    action.append(arrow);
    actions.append(action);
  }
  body.append(title, actions);
  card.append(media, body);
  const targetGrid = project.category === 'quiz' ? quizGrid : grid;
  targetGrid.append(card);
}

const quizCount = sortedProjects.filter(project => project.category === 'quiz').length;
document.getElementById('project-count').textContent = `${sortedProjects.length - quizCount} projects`;
document.getElementById('quiz-count').textContent = `${quizCount} quizzes`;
