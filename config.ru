PATH = File.expand_path "../", __FILE__

require 'bundler/setup'
Bundler.require :default

require "json" # load json gem?


use Rack::Reloader, 0
# use Rack::Static, :urls => ["*"]

TYPES = {
  css: "text/css",
  html: "text/html",
  js: "application/javascript",
  json: "application/json",
  haml: "text/haml",
  md: "text/markdown",
  sass: "text/sass",
  coffee: "text/x-coffeescript",
  ico: "image/x-icon", 
  xml: "text/xml",
  png: "image/png",
}

PATHS = JSON.parse( File.read("#{PATH}/routes.json") ).keys

class Loadr
  def self.load(file, type=:html)
    Proc.new do |env|
      path = env["REQUEST_PATH"]
      path = "/index.html" if path == "/" || PATHS.include?(path)
      file = "#{PATH}#{path}"
      unless File.exists? file
        [404, { "Content-Type" => TYPES[type]}, ["File '#{path}' not found"]]
      else
        body = File.read file
        cont_type = File.extname(file)[1..-1].to_sym
        content_type = TYPES[cont_type]
        [200, { "Content-Type" => content_type }, [body]] 
      end
    end
  end
end

run Loadr.load "index"

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )