/* AI by AO: small helpers for the secondary pages */
(function(){
  document.documentElement.classList.add('js');
  function init(){
    if(!('IntersectionObserver' in window)){document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});return}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    document.querySelectorAll('.rv').forEach(function(e){io.observe(e)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
