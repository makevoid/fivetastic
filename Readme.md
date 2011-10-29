# FiveTastic
### CoffeeScript, Sass and HAML at your disposal 
### the content it's static - you can deploy everywhere!

### Intro:

To start your own site/app with FiveTastic:

- fork/download fivetastic (forking is good so you can update to the latest version fairly easily)
   

host it on your usual web server (apache, nginx etc) or type this in the fivetastic folder:

    python -m SimpleHTTPServer 3000


### Guide:

What to edit:

all the files outside fivetastic folder are your app!

so to edit the template/layout you want to go to:

    haml/layout.haml

for the default page:

    haml/index.haml


### Routes

TODO: Routing system to be defined.... 

need support:
- routes
- history push/popState
- seo requests (ruby-rack/php fallback)


### Features:

- Coffeescript
- Haml
- Sass

### Features (to be implemented):

- service to host sites/apps easily


### Easy hosting!

It's static! host it everywhere!

I like to use this in dev:

    python -m SimpleHTTPServer 3000

on apache, nginx etc..

### dev mode (to be implemented):

    ruby config.ru


### default folders and files:

    / 
    /assets/
      app.css
      app.js
      imgs
    /coffee/
      app.coffee
    /haml/
      index.haml
      layout.haml
    /sass/
      app.sass
      mixins.sass


### vendored files:

coffeescript: http://jashkenas.github.com/coffee-script/extras/coffee-script.js
haml: https://github.com/uglyog/clientside-haml-js/tree/master/lib
jquery: https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js


### TODO:

- sass support (with reloading)
- update vendored files
  