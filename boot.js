'use strict';
if(new URLSearchParams(location.search).has('id')&&!location.hash){const script=document.createElement('script');script.src='./app.js';document.body.append(script);}else{location.replace('./auth.html'+location.search+location.hash);}
