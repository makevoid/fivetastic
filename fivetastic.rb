PATH = File.expand_path "../", __FILE__

require 'bundler/setup'
Bundler.require :default

require "json" # load json gem?


# use Rack::Reloader, 0
# use Rack::Static, :urls => ["*"]

PATHS = JSON.parse( File.read("#{PATH}/routes.json") )

MIME_TYPES = {
  ".haml"     => "text/haml",
  ".coffee"   => "text/x-coffeescript",
  ".md"       => "text/markdown",
  # ".js"       => "text/javascript; charset=UTF-8",
}

Rack::Mime::MIME_TYPES.merge! MIME_TYPES

class Fivetastic
  
  def self.call(env)
    path = env["PATH_INFO"] || "/"
    file = if path == "/" || PATHS.keys.include?(path) || route_matches(path)
      "#{PATH}/index.html"
    else#if static_file? path
      "#{PATH}#{path}"
    end
    
    unless File.exists? file
      [404, { "Content-Type" => get_type(:html)}, ["File '#{path}' not found - file: #{file}, paths: #{PATHS}"]]
    else
      render_file file
    end
  end
  
  # private
  
  def self.route_matches(path)
    match = nil
    PATHS.keys.each do |route|
      if route =~ /\*/
        match = path.match(/#{route.gsub(/\*/, "(.+)").gsub(/\//, "\\/")}/)
        break if match
      end
    end 
    match
  end
  
  def self.get_type(type)
    Rack::Mime.mime_type ".#{type}"
  end
  
  # def self.static_file?(path)
  #   path != "/" && File.exists?("#{PATH}/#{path}")
  # end
  
  def self.render_file(file)
    puts "file: #{file}"
    body = File.read file
    cont_type = File.extname(file)[1..-1].to_sym
    content_type = get_type cont_type 
    [200, { "Content-Type" => content_type }, [body]]
  end
  
end