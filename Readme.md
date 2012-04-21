# FiveTastic
### create sites and apps with HAML, CoffeeScript and Sass on the clientside
### the content it's static - you can deploy everywhere!

http://fivetastic.org


### Intro:

To start your own site/app with FiveTastic:

- fork/download fivetastic (forking is good so you can update to the latest version fairly easily)
- use a standard webserver like apache to host it or follow the following rules to launch a ruby rack server

launch server:

    rackup

note: if you don't have rack installed

    gem install bundler
    bundle install

in the app's folder

then visit <http://localhost:9292>


### Guide:

What to edit:

all the files outside fivetastic folder are your app!

so to edit the template/layout you want to go to:

    haml/layout.haml

for the default page:

    haml/index.haml


### Routes

Routes are defined in routes.json as a JSON hash.

    {
      "/":            "index",    # this maps the root url to a page named index
      "/page":        "page",     # standard mapping
      "/category/*":  "category"  # star route, maps all urls starting with '/category/'
    }


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
- supports PHP pages

### browsers supported:

- Chrome
- Safari 4+
- FF 3.6+
- IE 7+

### Easy hosting!

It's static! host it everywhere!

You can apache, nginx etc..

note: for apache you need to copy the .htaccess file and have mod_rewrite module enabled


### Deploy:

host it on your usual web server (apache, nginx etc) by putting this in your .htaccess or virtualhost

apache:

    see .htaccess

nginx:

    if (!-e $request_filename) {
      rewrite ^.+$ / break;
    }


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
jquery: https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js


### Seo support

Use a proxy that matches the user agent and redirects the request to another server that has your content and builds a landing page, this will be a feature of fiveapi.com


### TODO:

- specs + rewrite using better modularity (in progress..)

- handle 404s

- relative paths support (to try it without a web server)

- update codemirror
- support pushstate in IE8 trough https://github.com/balupton/history.js

- full router support
- markdown support
- rake task to generate RapidWeaver Template
- update vendored files
- add mustache support


## Contributing:

- fork the project, make changes
- run tests in your browser (see specs section below)
- send me a pull request


### things to know

if you make changes to javascript files, run:

    rake compile_js

to update vendor/all.js that contains all vendored libs and init.js, all in one file
(for coffee files is not needed because they're compiled clientside)


### Specs:

### setup test environment:

FiveTastic uses jasmine-headless-webkit ruby gem to run js specs, more infos here: http://johnbintz.github.com/jasmine-headless-webkit/

Basically you have to install Qt
for osx:

    brew install qt

and then :

    cd fivetastic
    bundle


### run specs:

ruby (rspec):

    cd fivetastic
    time rspec spec/acceptance/fivetastic_spec.rb


js (jasmine):

    cd fivetastic
    time jasmine-headless-webkit -j spec/jasmine.yml -c
