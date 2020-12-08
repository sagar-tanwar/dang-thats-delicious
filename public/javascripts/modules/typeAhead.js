import axios from 'axios';
import dompurify from 'dompurify';

const searchResultHTML = (stores) => {
  return stores.map(store => (
    `<a class="search__result" href="/store/${store.slug}">
      <strong>${store.name}</strong>
    </a>`
  )).join('')
}

function typeAhead (search) {
  if(!search) return; // no search box? skip it!

  const searchInput = search.querySelector('.search__input');
  const searchResult = search.querySelector('.search__results');

  searchInput.on('input', event => {
    if(event.target.value === '') {
      searchResult.style.display = 'none';
      return;
    }
    
    searchResult.style.display = 'block';
    
		// fetch the stores and show it to the user
    axios
    .get(`/api/search?q=${event.target.value}`)
    .then(res => {
      if(res.data.length) {
        searchResult.innerHTML = dompurify.sanitize(searchResultHTML(res.data));
      } else {
        searchResult.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${event.target.value} found!</div>`);
      }
    })
    .catch(err => console.error(err))
  })

	// handle keyboard inputs (Arrow up, Arrow down, Enter)
  let index = -1;
  searchInput.on('keyup', e => {
    if(![13, 38, 40].includes(e.keyCode)) return;
    const results = searchResult.querySelectorAll('.search__result');
    if(results.length) {
      if(e.keyCode === 40) {
        if(index === results.length - 1) {
          index = 0;
        } else {
          index++;
        }
      } else if(e.keyCode === 38) {
        if(index === 0) {
          index = results.length - 1;
        } else {
          index--;
        }
      } else if(e.keyCode === 13) {
        window.location = results[index].href;
      }
      results.forEach(result => result.classList.remove('search__result--active'));
      results[index].classList.add('search__result--active');
    }
  })
}

export default typeAhead;