require "spec_helper"

feature "Fivetastic server" do
  
  def should_render(page)
    page.status_code.should eq(200)
  end
  
  it "renders index.html" do
    visit "/"
    should_render page
    page.body.should =~ /<div id='loading'>/
  end
  
  it "renders index.html" do
    visit "/page1"
    should_render page
    page.body.should =~ /<div id='loading'>/
  end
  
  it "renders index.html [wildcard]" do
    visit "/pages/3"
    should_render page
    page.body.should =~ /<div id='loading'>/
  end  
  
  it "renders a static asset" do
    visit "/fivetastic/vendor/all.js"
    should_render page
    page.body.should =~ /Query v([\d\.]+) jquery.com/
  end
end