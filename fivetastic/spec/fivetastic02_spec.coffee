

describe "Fivetastic", ->
  it "defaults to prod mode", ->
    five = new Fivetastic()
    expect(five.mode).toEqual "prod"
    
    
  describe "Config", ->
    it "has defaults routes path", ->
      conf = new Fivetastic.Config()
      expect(conf.routes).toEqual "routes.json"

  
  