PATH = File.expand_path "../", __FILE__

require 'bundler/setup'
Bundler.require :default

require "json" # load json gem?


use Rack::Reloader, 0
# use Rack::Static, :urls => ["*"]

PATHS = JSON.parse( File.read("#{PATH}/routes.json") ).keys

class Loadr
  
  def self.get_type(type)
    Rack::Mime.mime_type ".#{type}"
  end
  
  def self.load(file, type=:html)
    Proc.new do |env|
      path = env["REQUEST_PATH"]
      path = "/index.html" if path == "/" || PATHS.include?(path)
      file = "#{PATH}#{path}"
      unless File.exists? file
        [404, { "Content-Type" => get_type(type)}, ["File '#{path}' not found"]]
      else
        body = File.read file
        cont_type = File.extname(file)[1..-1].to_sym
        content_type = get_type(type)
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