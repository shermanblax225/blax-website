const reviewForm = document.querySelector('.review-form');
const reviewCard = document.querySelector('#review-card');
const controls = document.querySelector('.review-controls');
const toggle = controls.querySelector('[data-review="toggle"]');
const status = document.querySelector('.review-status');
let reviews = [];
let index = 0;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderReview() {
  controls.hidden = reviews.length < 2;
  toggle.textContent = paused ? 'Play' : 'Pause';
  if (!reviews.length) {
    reviewCard.textContent = 'Be the first to share your experience.';
    return;
  }
  const {name, rating, comment} = reviews[index];
  const stars = document.createElement('p');
  stars.className = 'review-stars';
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  stars.setAttribute('aria-label', rating + ' out of 5 stars');
  const quote = document.createElement('blockquote');
  quote.textContent = comment;
  const author = document.createElement('p');
  author.className = 'muted';
  author.textContent = name || 'BLAX passenger';
  reviewCard.replaceChildren(stars, quote, author);
}

function advance(step) {
  if (reviews.length < 2) return;
  index = (index + step + reviews.length) % reviews.length;
  renderReview();
}

controls.addEventListener('click', event => {
  const action = event.target.dataset.review;
  if (action === 'toggle') {
    paused = !paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
  }
  if (action === 'prev' || action === 'next') advance(action === 'prev' ? -1 : 1);
});
setInterval(() => { if (!paused && !document.hidden) advance(1); }, 6500);

async function loadReviews() {
  const response = await fetch('/api/reviews');
  if (!response.ok) throw new Error('Could not load reviews.');
  reviews = await response.json();
  index = 0;
  renderReview();
}

reviewForm.addEventListener('submit', async event => {
  event.preventDefault();
  const {reviewer, rating, review} = reviewForm.elements;
  const button = reviewForm.querySelector('button');
  button.disabled = true;
  status.textContent = 'Publishing…';
  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: reviewer.value, rating: Number(rating.value), comment: review.value})
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Could not publish your review.');
    reviewForm.reset();
    status.textContent = 'Your review has been published.';
    await loadReviews().catch(() => { reviewCard.textContent = 'Refresh to see the latest reviews.'; });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

reviewForm.hidden = false;
loadReviews().catch(() => { reviewCard.textContent = 'Reviews are temporarily unavailable.'; });
