PATH = File.expand_path "../", __FILE__

require 'bundler/setup'
Bundler.require :default

require "json" # load json gem?


use Rack::Reloader, 0
# use Rack::Static, :urls => ["*"]

PATHS = JSON.parse( File.read("#{PATH}/routes.json") )

MIME_TYPES = {
  ".haml"     => "text/haml",
  ".coffee"   => "text/x-coffeescript",
  ".md"       => "text/markdown",
  # ".js"       => "text/javascript; charset=UTF-8",
}

Rack::Mime::MIME_TYPES.merge! MIME_TYPES

class Loadr
  
  def self.get_type(type)
    Rack::Mime.mime_type ".#{type}"
  end
  
  def self.load(file, type=:html)
    Proc.new do |env|
      path = env["REQUEST_PATH"]
      if path == "/" || PATHS.keys.include?(path)
        file = "#{PATH}/index.html"
      else
        page = PATHS[path]
        file = "#{PATH}/views/#{page}"
      
        default_format = "haml"
        file = "#{file}.#{default_format}" unless file =~ /\./
      end
      
      if static_file? path
        render_file "#{PATH}/#{path}"
      else
        unless File.exists? file
          [404, { "Content-Type" => get_type(type)}, ["File '#{path}' not found - #{file} - #{PATHS}"]]
        else
          render_file file
        end
      end
    end
  end
  
  def self.static_file?(path)
    path != "/" && File.exists?("#{PATH}/#{path}")
  end
  
  def self.render_file(file)
    body = File.read file
    cont_type = File.extname(file)[1..-1].to_sym
    content_type = get_type cont_type 
    [200, { "Content-Type" => content_type }, [body]]
  end
end

run Loadr.load "index"

# Rack::Handler::WEBrick.run(
#   MyApp.new, 
#   Port: 3000
# )