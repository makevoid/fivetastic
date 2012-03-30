require "spec_helper"

feature "Fivetastic" do

  it "should render the layout and first page", js: true do
    visit "/"
    page.status_code.should eq(200)
    find("#content").text.should =~ /Hello World!/
  # end
  #
  # it "should render the other pages", js: true do
  #   visit "/"
    click_link "Page 1"
    find("#content").text.should =~ /This is page 1/
    click_link "Page 2"
    find("#content").text.should =~ /php enabled\?/
    click_link "Page 3"
    find("#content").text.should =~ /test/
    page.evaluate_script('window.history.back()')
    find("#content").text.should =~ /php enabled\?/
  end

  it "should render edit layout button", js: true do
    visit "/"
    find("a[data-file='views/layout.haml']").text.should == "Layout"
  end

  it "should render edit layout button", js: true do
    visit "/"
    find("a[data-file='views/index.haml']").click
    find("#editor").text.should =~ /%h2 Hello World/
  end
end