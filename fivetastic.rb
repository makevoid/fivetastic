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
    if path == "/" || PATHS.keys.include?(path)
      file = "#{PATH}/index.html"
    else
      page = nil
      PATHS.keys.each do |cur_path|
        # PATHS[cur_path]
        
        if cur_path =~ /\*/
          match = path.match(/#{cur_path.gsub(/\*/, "(.+)").gsub(/\//, "\\/")}/)
          if match
            puts "match: #{match}, path: #{path}"
            # matches = match[1..-1] 
            page = PATHS[path]
            break
          # else return nil
          end
        end
        # puts "path: #{path}, cur_path: #{cur_path}, match: #{matches}"
        # false
      end
      
      # unless page
      #   page = PATHS[path]
      # end
      
      file = "#{PATH}/views/#{page}"
      puts "file: #{file}"
    
      default_format = "haml"
      file = "#{file}.#{default_format}" unless file =~ /\./
    end
    
    if static_file? path
      render_file "#{PATH}#{path}"
    else
      unless File.exists? file
        [404, { "Content-Type" => get_type(:html)}, ["File '#{path}' not found - file: #{file}, paths: #{PATHS}"]]
      else
        render_file file
      end
    end
  end
  
  # private
  
  def self.get_type(type)
    Rack::Mime.mime_type ".#{type}"
  end
  
  def self.static_file?(path)
    path != "/" && File.exists?("#{PATH}/#{path}")
  end
  
  def self.render_file(file)
    puts "file: #{file}"
    body = File.read file
    cont_type = File.extname(file)[1..-1].to_sym
    content_type = get_type cont_type 
    [200, { "Content-Type" => content_type }, [body]]
  end
  
end