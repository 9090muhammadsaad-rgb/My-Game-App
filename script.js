let games = [], apps = [], trendingNames = [];

// Load trending.txt
fetch('data/trending.txt')
  .then(r => r.text())
  .then(txt => {
    trendingNames = txt.split('\n').map(t => t.trim());
  });

// Load JSON
Promise.all([
  fetch('data/games.json').then(r => r.json()),
  fetch('data/apps.json').then(r => r.json())
]).then(([gamesData, appsData]) => {
  games = gamesData.map(i => ({ ...i, type: 'game' }));
  apps = appsData.map(i => ({ ...i, type: 'app' }));

  renderCarousel(apps.slice(0, 5));
  renderItems([...games, ...apps]);
});

// Render top apps carousel
function renderCarousel(items) {
  const carousel = document.getElementById('carousel');
  carousel.innerHTML = '';
  items.forEach(i => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.width = '180px';
    
    if (!i.icon || !i.description) {
      card.className = 'placeholder';
      card.innerText = 'Not Published Yet';
    } else {
      const iconSrc = (i.icon.endsWith('.png') || i.icon.endsWith('.jpg')) ? i.icon : '';
      card.innerHTML = `
        <img src="${iconSrc}" alt="${i.name}">
        <h4>${i.name}</h4>
        <a href="${i.download && i.download.trim() !== '' ? i.download : '#'}" 
           class="${i.download && i.download.trim() !== '' ? '' : 'disabled'}">
           ${i.download && i.download.trim() !== '' ? 'Download' : 'Coming Soon'}
        </a>
      `;
    }
    carousel.appendChild(card);
  });
}

// Render all items (games/apps)
function renderItems(items) {
  const list = document.getElementById('item-list');
  list.innerHTML = '';

  items.forEach(i => {
    const card = document.createElement('div');

    if (!i.icon || !i.description) {
      card.className = 'placeholder';
      card.innerText = 'Not Published Yet';
    } else {
      card.className = 'item-card';

      // Screenshots
      const screenshotsHTML = i.screenshots?.length > 0 ? 
        '<div class="screenshots">' + i.screenshots.map(img=>`<img src="${img}" width="80" height="80">`).join('') + '</div>' : '';

      // Videos
      const videosHTML = i.videos?.length > 0 ?
        '<div class="videos">' + i.videos.map(v=>`<video controls width="200"><source src="${v}" type="video/mp4"></video>`).join('') + '</div>' : '';

      // Download button
      const downloadHTML = `<a href="${i.download && i.download.trim() !== '' ? i.download : '#'}" 
        class="${i.download && i.download.trim() !== '' ? '' : 'disabled'}">
        ${i.download && i.download.trim() !== '' ? 'Download' : 'Coming Soon'}</a>`;

      // Icon accepts .jpg or .png
      const iconSrc = (i.icon.endsWith('.png') || i.icon.endsWith('.jpg')) ? i.icon : '';

      card.innerHTML = `
        <img src="${iconSrc}" alt="${i.name}">
        <h3>${i.name}</h3>
        <p>${i.description}</p>
        <p>Size: ${i.size || 'N/A'} | Time: ${i.time || 'N/A'}</p>
        ${screenshotsHTML}
        ${videosHTML}
        ${downloadHTML}
      `;
    }
    list.appendChild(card);
  });
}

// Search functionality
document.getElementById('search').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  const filtered = [...games, ...apps].filter(i =>
    (i.name && i.name.toLowerCase().includes(term)) ||
    (i.keywords && i.keywords.some(k => k.toLowerCase().includes(term)))
  );
  renderItems(filtered);
});

// Category filter buttons
document.querySelectorAll('.category-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.category-buttons button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    let items;
    if (filter === 'all') items = [...games, ...apps];
    else if (filter === 'games') items = games;
    else if (filter === 'apps') items = apps;
    else if (filter === 'trending') items = [...games, ...apps].filter(i => trendingNames.includes(i.name));
    else if (filter === 'recommended') items = [...games, ...apps].filter(i => i.recommended);

    renderItems(items);
  });
});

// Sorting
document.getElementById('sort-select').addEventListener('change', e => {
  const val = e.target.value;
  let items = [...games, ...apps];

  if (val === 'time-desc') items.sort((a, b) => new Date(b.time) - new Date(a.time));
  else if (val === 'time-asc') items.sort((a, b) => new Date(a.time) - new Date(b.time));
  else if (val === 'size-asc') items.sort((a, b) => parseSize(a.size) - parseSize(b.size));
  else if (val === 'size-desc') items.sort((a, b) => parseSize(b.size) - parseSize(a.size));

  renderItems(items);
});

// Parse size like "150MB"
function parseSize(s) {
  if (!s) return 0;
  const num = parseFloat(s);
  if (s.toLowerCase().includes('kb')) return num/1024;
  if (s.toLowerCase().includes('mb')) return num;
  if (s.toLowerCase().includes('gb')) return num*1024;
  return num;
}

// Voice search button
document.getElementById('speak-btn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    document.getElementById('search').value = text;
    document.getElementById('search').dispatchEvent(new Event('input'));
  }
});

// Back button scroll to top
document.getElementById('back-btn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
