url = "http://ws.audioscrobbler.com/2.0/?method=tasteometer.compare&limit=20&type1=user&type2=user&value1=makevoid&value2=lele7591&api_key=b25b959554ed76058ac220b7b2e0a026"

$.get url, (xml) ->
  console.log $(xml).find("score").text()




