PATH = File.expand_path "../", __FILE__

require 'bundler/setup'
Bundler.require :default

require "json" # load json gem?


use Rack::Reloader, 0
# use Rack::Static, :urls => ["*"]

TYPES = {
  html: "text/html",
  js: "application/javascript"
}

PATHS = JSON.parse( File.read("#{PATH}/routes.json") ).keys

class Loadr
  def self.load(file, type=:html)
    Proc.new do |env|
      path = env["REQUEST_PATH"]
      path = "/index.html" if path == "/" || PATHS.include?(path)
      body = File.read "#{PATH}#{path}"
      [200, { "Content-Type" => TYPES[type]}, [body]] 
    end
  end
end

run Loadr.load "index"

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )