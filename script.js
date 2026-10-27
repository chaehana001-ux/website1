const products=[{name:'레몬러쉬',description:'시트러스와 바질의 조화',detail:'부드러운 레몬러쉬 마우스 워시',image:new URL('./assets/21df0.png',import.meta.url).href},{name:'에메랄드비치',description:'사과와 블루베리의 상쾌한 조화',detail:'청량한 에메랄드 비치 가글',image:new URL('./assets/8589e.png',import.meta.url).href},{name:'선셋로맨스',description:'석양의 낭만을 담은',detail:'부드러운 선셋로맨스 마우스워시',image:new URL('./assets/81cb2.png',import.meta.url).href}];
const dialog=document.querySelector('dialog');
function openDialog(html){document.querySelector('.dialog-content').innerHTML=html;dialog.showModal()}
document.querySelector('.products').innerHTML=products.map((p,i)=>`<div class="product-slot"><article class="product" tabindex="0" role="button" aria-label="${p.name} 상세 보기" data-product="${i}"><h3>${p.name}<span>MOUTHWASH</span></h3><span class="product-number">${i+1}</span><p>${p.description}<br>${p.detail}</p><div class="product-photo"><img src="${p.image}" alt="${p.name} 마우스워시" loading="lazy"></div></article></div>`).join('');
const stories=[['A','기분 좋은 맛으로 시작되는 상쾌함',new URL('./assets/7d697.png',import.meta.url).href,new URL('./assets/b7759.png',import.meta.url).href],['B','워터 소믈리에와 완성한 특별한 플레이버',new URL('./assets/5b0d4.png',import.meta.url).href,new URL('./assets/37bd3.png',import.meta.url).href],['C','매일 반복되는 순간을 즐거운 루틴으로',new URL('./assets/52677.png',import.meta.url).href,new URL('./assets/29b74.png',import.meta.url).href],['D','상쾌함에도 취향이 있으니까',null,new URL('./assets/c1243.png',import.meta.url).href]];
document.querySelector('.stories').innerHTML=stories.map((s,i)=>`<article class="story"><div class="story-label"><b>${s[0]}</b><p>${s[1]}</p></div><div class="story-photo">${s[2]?`<img class="base" src="${s[2]}" alt="" loading="lazy" style="width:${[103.79,109.09,108.39][i]}%;height:${[77.85,81.82,81.29][i]}%;left:${[-1.95,-3.52,0][i]}%;top:${[11.17,7.8,10.43][i]}%">`:''}<img class="overlay" src="${s[3]}" alt="${s[1]}" loading="lazy"></div></article>`).join('');
function showProduct(i){const p=products[i];openDialog(`<img src="${p.image}" alt="${p.name}"><h2>${p.name}</h2><p>${p.description}<br>${p.detail}</p><p>COMING SOON — 곧 만나보실 수 있습니다.</p>`)}
document.querySelectorAll('[data-product]').forEach(el=>{el.addEventListener('click',()=>showProduct(+el.dataset.product));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showProduct(+el.dataset.product)}})});
document.querySelectorAll('.cart').forEach(el=>el.addEventListener('click',()=>openDialog('<h2>COMING SOON</h2><p>쿨리타의 새로운 상쾌함을 준비하고 있습니다.<br>제품 출시 후 구매하실 수 있습니다.</p><a class="pill" href="#shop" id="browse">제품 둘러보기</a>')));
document.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.id==='browse')dialog.close()});
document.querySelectorAll('[data-policy]').forEach(el=>el.addEventListener('click',()=>openDialog(`<h2>${el.dataset.policy}</h2><p>이 페이지는 CULITA 디자인을 구현한 포트폴리오 데모입니다. 실제 상품 판매 및 개인정보 수집 기능은 제공하지 않습니다.</p>`)));
function updateTime(){document.querySelector('#time').textContent=new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Dubai'}).format(new Date())+' GST'}updateTime();setInterval(updateTime,60000);

// Reveal the introduction letter by letter as each paragraph crosses the viewport.
function collectAboutLetters() {
return [...document.querySelectorAll('.about-copy > p')].map(paragraph => {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const character of node.textContent) {
      if (/\s/u.test(character)) {
        fragment.append(document.createTextNode(character));
      } else {
        const span = document.createElement('span');
        span.className = 'reveal-letter';
        span.textContent = character;
        fragment.append(span);
      }
    }
    node.replaceWith(fragment);
  }
  return { paragraph, letters: [...paragraph.querySelectorAll('.reveal-letter')] };
});
}
let revealParagraphs = collectAboutLetters();
const aboutRevealReference = revealParagraphs.flatMap(group => group.letters).map(letter => letter.textContent).join('');
const revealMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
// Keep revealed content visible until it fully leaves, then replay on either re-entry.
function replayWhenVisible(element, className, ready) {
  const rect = element.getBoundingClientRect();
  const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
  element.classList.toggle(className, revealMotionPreference.matches ||
    (onScreen && (ready || element.classList.contains(className))));
}

let revealFrame = 0;
function updateLetterReveal() {
  revealFrame = 0;
  const viewportHeight = window.innerHeight;
  const section = document.querySelector('.about');
  const pin = document.querySelector('.about-pin');
  const sectionRect = section.getBoundingClientRect();
  const letters = revealParagraphs.flatMap(group => group.letters);
  const firstParagraph = revealParagraphs[0].paragraph;
  const firstOffset = firstParagraph.getBoundingClientRect().top - pin.getBoundingClientRect().top;
  // Keep the original text reveal pace, but release the pin as “취향” darkens.
  const entryDistance = Math.max(0, viewportHeight * 0.85 - firstOffset);
  const revealDistance = entryDistance + pin.offsetHeight * 1.6;
  // Keep the scroll and bottle timeline stable when the user changes the copy.
  const text = aboutRevealReference;
  const releaseLetter = text.lastIndexOf('취향');
  const releaseProgress = releaseLetter < 0 ? 1 : (releaseLetter + 1) / text.length;
  const progressAfterWord = word => {
    const wordStart = text.indexOf(word);
    return wordStart < 0 ? 1 : (wordStart + word.length) / text.length;
  };
  section.dataset.firstBottleChange = progressAfterWord('익숙한').toFixed(4);
  section.dataset.secondBottleChange = progressAfterWord('순간').toFixed(4);
  const pinDistance = Math.max(0, releaseProgress * revealDistance - entryDistance);
  const pinDistanceValue = `${pinDistance.toFixed(2)}px`;
  if (section.style.getPropertyValue('--about-pin-distance') !== pinDistanceValue) {
    section.style.setProperty('--about-pin-distance', pinDistanceValue);
  }
  section.dataset.releaseScroll = String(sectionRect.top + window.scrollY + pinDistance);
  const progress = revealMotionPreference.matches ? 1 : Math.max(0, Math.min(1,
    (entryDistance - sectionRect.top) / Math.max(1, revealDistance)
  ));
  section.dataset.revealProgress = progress.toFixed(4);
  letters.forEach((letter, index) => {
    const strength = section.dataset.manualSlide === 'true' ? 1 : Math.max(0, Math.min(1, progress * letters.length - index));
    const shade = Math.round(210 * (1 - strength));
    letter.style.color = `rgb(${shade}, ${shade}, ${shade})`;
  });
}
function scheduleLetterReveal() {
  if (!revealFrame) revealFrame = requestAnimationFrame(updateLetterReveal);
}
window.addEventListener('scroll', scheduleLetterReveal, { passive: true });
window.addEventListener('resize', scheduleLetterReveal);
window.addEventListener('pageshow', scheduleLetterReveal);
revealMotionPreference.addEventListener('change', scheduleLetterReveal);
document.fonts.ready.then(scheduleLetterReveal);
updateLetterReveal();

// A single copy area changes in place; retain the original light/bold typography.
const aboutSection = document.querySelector('.about');
const aboutCopy = aboutSection.querySelector('.about-copy');
const aboutNote = aboutSection.querySelector('.about-note');
const aboutText = [...aboutCopy.querySelectorAll(':scope > p')];
const aboutSlides = [
  { top: aboutText[0].innerHTML, bottom: aboutText[1].innerHTML, note: aboutNote.innerHTML },
  {
    top: '오늘의 <strong>기분</strong>에 따라<br><strong>새로운 취향</strong>을 발견하는 순간',
    bottom: '입안에 <strong>퍼지는 향</strong>까지<br><strong>나만의 감각</strong>으로 <strong>선택</strong>하다',
    note: '산뜻한 시트러스부터 트로피컬 프루츠, 달콤한 붉은 과실향까지.<br>오늘의 기분에 어울리는 플레이버로 나만의 상쾌함을 찾아보세요.',
  },
  {
    top: '평범한 <strong>일상</strong>을 넘어<br><strong>나를 위한 시간</strong>을 만드는 순간',
    bottom: '매일의 <strong>작은 케어</strong>까지<br><strong>기분 좋은 선물</strong>로 <strong>기념</strong>하다',
    note: '하루를 시작하는 아침에도, 나를 돌보는 저녁에도.<br>쿨리타와 함께하는 작은 루틴으로 오늘의 나에게 기분 좋은 인사를 건네세요.',
  },
];
let aboutSlideIndex = 0;
const aboutStatus = document.createElement('span');
aboutStatus.className = 'about-slide-status';
aboutStatus.setAttribute('role', 'status');
aboutStatus.setAttribute('aria-live', 'polite');
aboutSection.querySelector('.about-pin').append(aboutStatus);
aboutCopy.id = 'about-slide-copy';
aboutCopy.setAttribute('role', 'group');
aboutCopy.setAttribute('aria-roledescription', '슬라이드');
aboutCopy.setAttribute('aria-label', '1 / 3');
document.querySelectorAll('.about .slide').forEach(button => {
  button.setAttribute('aria-controls', aboutCopy.id);
  button.addEventListener('click', () => {
    const direction = button.classList.contains('next') ? 1 : -1;
    aboutSlideIndex = (aboutSlideIndex + direction + aboutSlides.length) % aboutSlides.length;
    const content = aboutSlides[aboutSlideIndex];
    aboutText[0].innerHTML = content.top;
    aboutText[1].innerHTML = content.bottom;
    aboutNote.innerHTML = content.note;
    // Strip existing letter wrappers when restoring the initial slide.
    aboutText.forEach(paragraph => paragraph.querySelectorAll('.reveal-letter').forEach(letter => letter.replaceWith(letter.textContent)));
    revealParagraphs = collectAboutLetters();
    aboutSection.dataset.manualSlide = 'true';
    aboutCopy.setAttribute('aria-label', `${aboutSlideIndex + 1} / ${aboutSlides.length}`);
    aboutStatus.textContent = `${aboutSlideIndex + 1} / ${aboutSlides.length}`;
    updateLetterReveal();
    if (!revealMotionPreference.matches) {
      [...aboutText, aboutNote].forEach(element => {
        element.getAnimations().forEach(animation => animation.cancel());
        element.animate([
          { opacity: 0, transform: `translateX(${direction * 16}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ], { duration: 320, easing: 'ease-out' });
      });
    }
  });
});

// Reveal each story as the trail reaches it without interrupting native scroll.
const trailSection = document.querySelector('.advantages');
const trailArtwork = trailSection.querySelector('.trail');
const trailStops = [...trailArtwork.querySelectorAll('.dot')];
const storyCards = [...trailSection.querySelectorAll('.story')];
const compactStories = window.matchMedia('(max-width: 600px)');
let trailFrame = 0;
function updateStoryReveal() {
  trailFrame = 0;
  const reducedMotion = revealMotionPreference.matches;
  const viewportHeight = window.innerHeight;
  const cursor = viewportHeight * 0.72;
  const scrollPosition = window.scrollY;
  const thresholds = storyCards.map((card, index) => {
    const mobileOrFirst = compactStories.matches || index === 0;
    const anchor = mobileOrFirst ? card.querySelector('.story-photo') : trailStops[index];
    return anchor.getBoundingClientRect().top + scrollPosition
      - (mobileOrFirst ? viewportHeight * 0.35 : cursor);
  });
  const trailRect = trailArtwork.getBoundingClientRect();
  const stopRects = trailStops.map(stop => stop.getBoundingClientRect());
  const progress = reducedMotion ? 1 : Math.max(0, Math.min(1,
    (cursor - trailRect.top) / Math.max(1, trailRect.height)
  ));
  trailArtwork.style.setProperty('--trail-hidden', `${(1 - progress) * 100}%`);
  trailStops.forEach((stop, index) => {
    stop.classList.toggle('is-reached', reducedMotion || stopRects[index].top <= cursor);
  });
  storyCards.forEach((card, index) => {
    const reached = reducedMotion || scrollPosition >= thresholds[index] - 1;
    replayWhenVisible(card, 'is-visible', reached);
  });
  trailSection.classList.add('is-animated');
}
function scheduleStoryReveal() {
  if (!trailFrame) trailFrame = requestAnimationFrame(updateStoryReveal);
}
window.addEventListener('scroll', scheduleStoryReveal, { passive: true });
window.addEventListener('resize', scheduleStoryReveal);
window.addEventListener('pageshow', scheduleStoryReveal);
revealMotionPreference.addEventListener('change', scheduleStoryReveal);
compactStories.addEventListener('change', scheduleStoryReveal);
document.fonts.ready.then(scheduleStoryReveal);
updateStoryReveal();

// Bring the standards rows in one by one when its title reaches mid-screen.
const standardsSection = document.querySelector('.standards');
const standardsTitle = standardsSection?.querySelector('h2');
const standardsTitleLetters = [];
let standardsFrame = 0;

if (standardsTitle) {
  const walker = document.createTreeWalker(standardsTitle, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const character of node.textContent) {
      if (/\s/u.test(character)) {
        fragment.append(document.createTextNode(character));
      } else {
        const letter = document.createElement('span');
        letter.className = 'standards-title-letter';
        letter.style.setProperty('--letter-index', standardsTitleLetters.length);
        letter.textContent = character;
        standardsTitleLetters.push(letter);
        fragment.append(letter);
      }
    }
    node.replaceWith(fragment);
  }
}

function updateStandardsReveal() {
  standardsFrame = 0;
  if (!standardsSection || !standardsTitle) return;
  const titleRect = standardsTitle.getBoundingClientRect();
  const titleCenter = titleRect.top + titleRect.height / 2;
  const reachedMiddle = titleCenter <= window.innerHeight * 0.55;
  const stillVisible = standardsSection.getBoundingClientRect().bottom > 0;
  replayWhenVisible(standardsSection, 'is-revealed', reachedMiddle && stillVisible);
}

function scheduleStandardsReveal() {
  if (!standardsFrame) standardsFrame = requestAnimationFrame(updateStandardsReveal);
}

standardsSection?.classList.add('is-animated');
window.addEventListener('scroll', scheduleStandardsReveal, { passive: true });
window.addEventListener('resize', scheduleStandardsReveal);
window.addEventListener('pageshow', scheduleStandardsReveal);
revealMotionPreference.addEventListener('change', scheduleStandardsReveal);
updateStandardsReveal();

// Reveal the closing headline in one compact mask-and-focus motion.
const closingSection = document.querySelector('.closing');
const closingHeadline = closingSection?.querySelector('h2');
const closingLetters = [];
let closingFrame = 0;

if (closingHeadline) {
  const walker = document.createTreeWalker(closingHeadline, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const character of node.textContent) {
      if (/\s/u.test(character)) {
        fragment.append(document.createTextNode(character));
      } else {
        const letter = document.createElement('span');
        letter.className = 'closing-reveal-letter';
        letter.style.setProperty('--letter-index', closingLetters.length);
        letter.textContent = character;
        closingLetters.push(letter);
        fragment.append(letter);
      }
    }
    node.replaceWith(fragment);
  }
}

function updateClosingReveal() {
  closingFrame = 0;
  if (!closingHeadline || !closingLetters.length) return;
  const rect = closingHeadline.getBoundingClientRect();
  const headlineCenter = rect.top + rect.height / 2;
  const sectionBottom = closingSection.getBoundingClientRect().bottom;
  const isReady = headlineCenter <= window.innerHeight * 0.55 && sectionBottom > 0;
  replayWhenVisible(closingHeadline, 'is-visible', isReady);
}

function scheduleClosingReveal() {
  if (!closingFrame) closingFrame = requestAnimationFrame(updateClosingReveal);
}

closingSection?.classList.add('has-title-motion');
window.addEventListener('scroll', scheduleClosingReveal, { passive: true });
window.addEventListener('resize', scheduleClosingReveal);
window.addEventListener('pageshow', scheduleClosingReveal);
revealMotionPreference.addEventListener('change', scheduleClosingReveal);
document.fonts.ready.then(scheduleClosingReveal);
updateClosingReveal();

// Reveal the shop headline in place with a soft character-by-character mask.
const shopSection = document.querySelector('.shop');
const shopTitle = shopSection?.querySelector('h2');
let shopTitleFrame = 0;

if (shopTitle) {
  const fragment = document.createDocumentFragment();
  let letterIndex = 0;
  for (const character of shopTitle.textContent) {
    if (/\s/u.test(character)) {
      fragment.append(document.createTextNode(character));
    } else {
      const letter = document.createElement('span');
      letter.className = 'shop-title-letter';
      letter.style.setProperty('--letter-index', letterIndex++);
      letter.textContent = character;
      fragment.append(letter);
    }
  }
  shopTitle.replaceChildren(fragment);
}

function updateShopTitle() {
  shopTitleFrame = 0;
  if (!shopSection || !shopTitle) return;
  const sectionRect = shopSection.getBoundingClientRect();
  const titleRect = shopTitle.getBoundingClientRect();
  // Wait until the complete title is comfortably inside the viewport.
  const inTriggerRange = titleRect.bottom <= window.innerHeight * 0.68 && sectionRect.bottom > 0;
  replayWhenVisible(shopTitle, 'is-visible', inTriggerRange);
}

function scheduleShopTitle() {
  if (!shopTitleFrame) shopTitleFrame = requestAnimationFrame(updateShopTitle);
}

shopSection?.classList.add('has-title-motion');
window.addEventListener('scroll', scheduleShopTitle, { passive: true });
window.addEventListener('resize', scheduleShopTitle);
window.addEventListener('pageshow', scheduleShopTitle);
revealMotionPreference.addEventListener('change', scheduleShopTitle);
updateShopTitle();

// Reveal the advantages headline in place with a short, weighty mask motion.
const advantagesTitle = trailSection.querySelector('.section-heading h2');
const advantagesLetters = [];
let advantagesTitleFrame = 0;

if (advantagesTitle) {
  const walker = document.createTreeWalker(advantagesTitle, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const character of node.textContent) {
      if (/\s/u.test(character)) {
        fragment.append(document.createTextNode(character));
      } else {
        const letter = document.createElement('span');
        letter.className = 'advantages-title-letter';
        letter.style.setProperty('--letter-index', advantagesLetters.length);
        letter.textContent = character;
        advantagesLetters.push(letter);
        fragment.append(letter);
      }
    }
    node.replaceWith(fragment);
  }
}

function updateAdvantagesTitle() {
  advantagesTitleFrame = 0;
  if (!advantagesTitle) return;
  const titleRect = advantagesTitle.getBoundingClientRect();
  const sectionRect = trailSection.getBoundingClientRect();
  const isReady = titleRect.bottom <= window.innerHeight * 0.72 && sectionRect.bottom > 0;
  replayWhenVisible(advantagesTitle, 'is-visible', isReady);
}

function scheduleAdvantagesTitle() {
  if (!advantagesTitleFrame) advantagesTitleFrame = requestAnimationFrame(updateAdvantagesTitle);
}

trailSection.classList.add('has-heading-motion');
window.addEventListener('scroll', scheduleAdvantagesTitle, { passive: true });
window.addEventListener('resize', scheduleAdvantagesTitle);
window.addEventListener('pageshow', scheduleAdvantagesTitle);
revealMotionPreference.addEventListener('change', scheduleAdvantagesTitle);
updateAdvantagesTitle();

// Retain readable source articles as the no-JavaScript version of the story.
initBrandShowcase();
function initBrandShowcase() {
  const section = document.querySelector('.origin-stories');
  const rows = [...section.querySelectorAll('.origin-row')];
  const stage = document.createElement('div');
  stage.className = 'brand-stage';
  const backgrounds = document.createElement('div');
  backgrounds.className = 'brand-backgrounds';
  backgrounds.setAttribute('aria-hidden', 'true');
  const intro = document.createElement('div');
  intro.className = 'brand-intro';
  intro.innerHTML = '<p class="eyebrow">● OUR STORY ●</p><h2>CHEERS<br>TO LIFE</h2><p>나를 돌보는 작은 순간,<br>쿨리타와 함께하는 특별한 일상.</p>';
  const cards = document.createElement('div');
  cards.className = 'brand-cards';
  const card = document.createElement('article');
  card.className = 'brand-card';
  card.id = 'brand-story-current';
  cards.append(card);
  const storyContents = [];
  const navigation = document.createElement('div');
  navigation.className = 'brand-navigation';
  navigation.setAttribute('role', 'group');
  navigation.setAttribute('aria-label', '브랜드 스토리 선택');
  rows.forEach((row, index) => {
    const art = row.querySelector('.origin-art');
    const image = art.cloneNode();
    image.removeAttribute('class');
    image.alt = '';
    image.loading = 'eager';
    backgrounds.append(image);
    art.remove();
    storyContents.push(row.querySelector('.origin-copy').outerHTML);
    row.remove();
    const button = document.createElement('button');
    button.className = 'brand-thumbnail';
    button.setAttribute('aria-label', `${index + 1}. ${row.querySelector('h2').textContent}`);
    button.setAttribute('aria-controls', card.id);
    button.innerHTML = `<img src="${image.getAttribute('src')}" alt=""><span>0${index + 1}</span>`;
    button.addEventListener('click', () => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + index * window.innerHeight, behavior: revealMotionPreference.matches ? 'instant' : 'smooth' });
    });
    navigation.append(button);
  });
  const counter = document.createElement('p');
  counter.className = 'brand-counter';
  const controls = document.createElement('div');
  controls.className = 'brand-controls';
  controls.innerHTML = '<button aria-label="이전 브랜드 스토리">←</button><span></span><button aria-label="다음 브랜드 스토리">→</button>';
  controls.replaceChild(counter, controls.querySelector('span'));
  stage.append(backgrounds, intro, cards, navigation, controls);
  section.append(stage);
  section.classList.add('brand-showcase');
  let active = -1;
  let frame = 0;
  function update() {
    frame = 0;
    const progress = -section.getBoundingClientRect().top / window.innerHeight;
    const next = Math.max(0, Math.min(rows.length - 1, Math.floor(progress + .18)));
    if (next === active) return;
    active = next;
    card.innerHTML = storyContents[active];
    if (!revealMotionPreference.matches) {
      card.getAnimations().forEach(animation => animation.cancel());
      card.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 350, easing: 'ease-out' });
    }
    rows.forEach((_, i) => {
      backgrounds.children[i].classList.toggle('is-active', i === active);
      navigation.children[i].setAttribute('aria-pressed', String(i === active));
    });
    counter.textContent = `0${active + 1} / 0${rows.length}`;
    controls.firstElementChild.disabled = active === 0;
    controls.lastElementChild.disabled = active === rows.length - 1;
  }
  controls.firstElementChild.addEventListener('click', () => navigation.children[Math.max(0, active - 1)].click());
  controls.lastElementChild.addEventListener('click', () => navigation.children[Math.min(rows.length - 1, active + 1)].click());
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  update();
}



// Move only the background wordmark; leave bottle rotation and layout untouched.
const heroWordmarkSection = document.querySelector('.hero');
const heroWordmark = heroWordmarkSection?.querySelector('.wordmark');
heroWordmark?.classList.add('has-entry-motion');
let heroWordmarkFrame = 0;
function updateHeroWordmark() {
  heroWordmarkFrame = 0;
  if (!heroWordmark) return;
  const rect = heroWordmarkSection.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
  const distance = window.innerWidth <= 600 ? 14 : 30;
  const shift = revealMotionPreference.matches ? 0 : -distance * progress;
  heroWordmark.style.setProperty('--hero-wordmark-shift', `${shift.toFixed(2)}px`);
  replayWhenVisible(heroWordmark, 'is-visible', true);
}
function scheduleHeroWordmark() {
  if (!heroWordmarkFrame) heroWordmarkFrame = requestAnimationFrame(updateHeroWordmark);
}
window.addEventListener('scroll', scheduleHeroWordmark, { passive: true });
window.addEventListener('resize', scheduleHeroWordmark);
window.addEventListener('pageshow', scheduleHeroWordmark);
revealMotionPreference.addEventListener('change', scheduleHeroWordmark);
updateHeroWordmark();

// Observe stationary slots so card movement cannot retrigger its own observer.
const productGrid = document.querySelector('.products');
if (productGrid && 'IntersectionObserver' in window) {
  const productSlots = [...productGrid.querySelectorAll('.product-slot')];
  const productEntranceObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
        entry.target.classList.add('is-card-visible');
      } else if (!entry.isIntersecting) {
        entry.target.classList.remove('is-card-visible');
      }
    }
  }, { threshold: [0, 0.1] });
  function syncProductEntrance() {
    productEntranceObserver.disconnect();
    productGrid.classList.toggle('has-card-motion', !revealMotionPreference.matches);
    for (const slot of productSlots) {
      slot.classList.remove('is-card-visible');
      if (!revealMotionPreference.matches) productEntranceObserver.observe(slot);
    }
  }
  revealMotionPreference.addEventListener('change', syncProductEntrance);
  syncProductEntrance();
}
