
describe( "Jasmine", ->

  # beforeAll
  
  $("body").append "<div id='events'></div>"
  events = $("#events")
  g = window
  g.fivetastic.start(events)
  
  it("should launch fivetastic", ->
    events.bind("page_loaded", ->
      expect(events).toHaveText('FiveTastic')
    )
  )
  
  it("should launch fivetastic", ->
    events.bind("page_loaded", ->
      expect(events).toHaveText('hello world!')
    )
  )
)
