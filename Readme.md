# FiveTastic
### create sites and apps with HAML, CoffeeScript and Sass on the clientside
### the content it's static - you can deploy everywhere!

http://fivetastic.org

### Intro:

To start your own site/app with FiveTastic:

- fork/download fivetastic (forking is good so you can update to the latest version fairly easily)
   

type this in the fivetastic folder:

    rackup



note: if you don't have rack

    gem install bundler
    bundle install

in the app's folder

### Deploy:

host it on your usual web server (apache, nginx etc) by putting this in your .htaccess or virtualhost

apache:

    TODO: apache vhost

nginx:

    TODO: apache vhost


### Guide:

What to edit:

all the files outside fivetastic folder are your app!

so to edit the template/layout you want to go to:

    haml/layout.haml

for the default page:

    haml/index.haml


### Routes

basic routes support is done, see routes.json

TODO: Routing system to be defined.... 

need support:
- complex routes
- seo requests (ruby-rack/php/static fallback)


### Libraries:

- Coffeescript
- HAML
- SASS
- JQuery/Zepto


## Features:
- loads HAML and SASS files asynchronously (ajax)
- has layout file (reuse html)
- handles history changes (pushState/onpopstate)
- integrates editor to develop directly into the browser (CodeMirror editor, the files are saved into the browser's localStorage)
- host it everywhere! (it's only html and js)


### Easy hosting!

It's static! host it everywhere!

You can apache, nginx etc..

note: for apache you need to copy the .htaccess file and have mod_rewrite module enabled


### Cloud9 IDE Integration

To make a fivetastic app and develop it easily online:

- fork the makevoid/fivetastic repo (should be this one)
- go into your cloud9 account on http://cloud9ide.com
- make sure github integration is activated
- choose the project from the list and clone it
- open the project
- in the shell/cli at the bottom of the editor type: 

>

    npm install coffeee-script

- press the '> run' button or 'Run Configurations...' to open the run configurations
- add a new run configuration
- choose a name and put "deploy/cloud9.js" as 'File path'
- press '> run'
- click on the first url/link appeared in console (should be something like 'http://fivetastic.username.cloud9ide.com')

you should see fivetastic default index page, you can remove the default haml/sass and roll your own!

enjoy!


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

- specs
- rewrite using better modularity

- editing preview
- full router support
- markdown support
- rake task to generate RapidWeaver Template
- update vendored files


## Contributing:

- fork the project, make changes
- run tests in your browser (see specs section below) 
- send me a pull request


### things to know

if you make changes to javascript files, run:

    rake compile_js

to update vendor/all.js that contains all vendored libs and init.js, all in one file
(for coffee files is not needed because they're compiled clientside)
  
  
### run specs:

the specs are made with Jasmine and Coffeescript, and are contained in the following file:

    /fivetastic/spec/fivetastic_spec.coffee


go to this url to run them:

    http://localhost:3000/fivetastic/spec/all.html

NEW:

### setup test environment:

FiveTastic uses jasmine-headless-webkit ruby gem to run specs, more infos here: http://johnbintz.github.com/jasmine-headless-webkit/

Basically you have to install Qt
for osx: 

    brew install qt

and the gem:

    gem i jasmine-headless-webkit


### run specs: 

    time jasmine-headless-webkit -j spec/support/jasmine.yml