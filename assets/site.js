/* AI by AO: cookie consent + analytics, shared by every page.
   Analytics never loads until the visitor accepts.
   To switch analytics on, paste your Google Analytics 4 measurement ID below (it looks like G-XXXXXXXXXX). */
(function(){
  var GA_ID='';
  var KEY='aiao-consent';
  function get(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function set(v){try{localStorage.setItem(KEY,v)}catch(e){}}

  function loadAnalytics(){
    if(!GA_ID||window.__aiaoGA)return;window.__aiaoGA=true;
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);document.head.appendChild(s);
    window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());window.gtag('config',GA_ID,{anonymize_ip:true});
  }
  /* aiaoTrack('event_name',{...}) records an event once analytics is allowed and configured */
  window.aiaoTrack=function(name,params){if(window.gtag&&get()==='granted')window.gtag('event',name,params||{})};

  var css='.cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:400;max-width:560px;margin-left:auto;padding:20px 22px;border-radius:20px;background:rgba(12,14,34,.92);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 30px 70px -20px rgba(0,0,0,.9),0 0 60px -24px #8b5cf6;color:#eef2ff;font:14px/1.55 Inter,system-ui,sans-serif;transform:translateY(130%);opacity:0;transition:transform .55s cubic-bezier(.2,.9,.2,1),opacity .4s}'+
  '.cc.on{transform:none;opacity:1}.cc h4{font:600 16px "Space Grotesk",system-ui,sans-serif;margin:0 0 6px;display:flex;gap:8px;align-items:center}.cc p{margin:0 0 14px;color:#a9b2d0}.cc a{color:#38e1ff}'+
  '.cc .row{display:flex;gap:10px;flex-wrap:wrap}.cc button{font:600 14px Inter,system-ui,sans-serif;padding:11px 18px;border-radius:12px;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;transition:.2s}'+
  '.cc button:hover{border-color:#38e1ff}.cc .yes{background:linear-gradient(115deg,#38e1ff,#8b5cf6 55%,#ff4fd8);color:#05060f;border:0}'+
  '@media (prefers-reduced-motion:reduce){.cc{transition:none}}';
  var box;
  function show(){
    if(!box){
      var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
      box=document.createElement('div');box.className='cc';box.setAttribute('role','dialog');box.setAttribute('aria-live','polite');box.setAttribute('aria-label','Cookie preferences');
      box.innerHTML='<h4><span aria-hidden="true">🍪</span> Cookies, your choice</h4><p>We use optional analytics cookies to understand which parts of the site are useful. They only switch on if you accept. Read our <a href="privacy.html#cookies">privacy policy</a>.</p><div class="row"><button class="yes" type="button">Accept analytics</button><button class="no" type="button">Reject</button></div>';
      document.body.appendChild(box);
      box.querySelector('.yes').onclick=function(){decide('granted')};
      box.querySelector('.no').onclick=function(){decide('denied')};
    }
    document.documentElement.classList.add('consent-open');
    requestAnimationFrame(function(){requestAnimationFrame(function(){box.classList.add('on')})});
  }
  function hide(){if(box)box.classList.remove('on');document.documentElement.classList.remove('consent-open')}
  function decide(v){set(v);hide();if(v==='granted')loadAnalytics()}
  window.aiaoCookieSettings=show;

  /* any element with data-track="event_name" is recorded when clicked */
  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[data-track]');if(t)window.aiaoTrack(t.getAttribute('data-track'),{label:(t.textContent||'').trim().slice(0,60)});
    var c=e.target.closest&&e.target.closest('[data-cookie-settings]');if(c){e.preventDefault();show()}
  });

  function init(){var v=get();if(v==='granted')loadAnalytics();else if(!v)setTimeout(show,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
