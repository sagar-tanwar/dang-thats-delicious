import axios from 'axios';
import { $ } from './bling'

function ajaxHeart(e) {
  e.preventDefault();
  const heartForm = e.currentTarget;
  axios
    .post(heartForm.action)
    .then(({ data }) => {
      const isHearted = heartForm.heart.classList.toggle('heart__button--hearted')
      if(isHearted) {
        heartForm.heart.classList.add('heart__button--float');
        setTimeout(() => heartForm.heart.classList.remove('heart__button--float'), 2500);
      }
      $('.heart-count').textContent = data.hearts.length;
    })
    .catch(console.error)
}

export default ajaxHeart;