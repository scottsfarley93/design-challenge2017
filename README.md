# withinMinutes

This project was written for the 2017 UW Cartography Design Challenge. Its goal is to be an analytic tool for community project managers looking for new sites to put community centers. Using publicly available data, it provides information on demographics, public infrastructure, and land value within a specified travel-time buffer. It is designed to be included in an interactive workflow that includes identifying candidate parcels and testing whether those parcels meet proejct-specific criteria.

Currently, there is only data for parcels in the *City of Madison*. Other cities may be added as time and data allow. 

![Thumbnail Image](http://scottsfarley.com/assets/withinMinutes_thumb.png)

## Live Demo 

A live demo lives [here](http://scottsfarley.com/withinMinutes).

## Back-end 

The heart of this project is on the back end, where a node application calculates statistics within the travel time buffer. The API to this backend is public, and can be accessed via  ```http://grad.geography.wisc.edu:4000/execute```. The service calls the Mapzen mobility API [https://mapzen.com/documentation/mobility/isochrone/api-reference/](https://mapzen.com/documentation/mobility/isochrone/api-reference/) to calculate isochrones based to travel mode and desired number of minutes. 

#### Request Parameters:

* ```latitude```:  Latitude of buffer center  (required)
* ```longitude```: Longitude of buffer center (required)
* ```time```: Time in minutes to calculate away from buffer center  (required)
* ```method```: Travel mode (options: ```pedestrian```, ```auto```, ```bicycle```, ```multimodal```) (required)
* ```layers```: Layers to calculate statistics on (default: all), (options: ```busStops```, ```fireStations```, ```bikeShare```, ```policeStations```, ```libraries```)

#### Response Parameters: 

The response from the API call is a geojson object. The geometry contains the polygon(s) resulting from the isochrone call. The properties contain the statistics calculated within the buffer polygon. 
 
 #### Running the server 
 
 ```node server/app.js```
 
 Opens a listener on port 4000. 
 
 ## Front End
 
 The front end listens for user click events on the map interface. When a click is detected, two procedures are triggered: 
  1. The address of the click is determined using the Mapzen [https://mapzen.com/products/search/](search) function. 
  2. An API call to the backend server described above is issued. 
 
 When a response for both calls are received, the results are shown on the UI.
 
 The user is also able to change the distance of the buffer and the mode of travel, using the buttons and slider at the bottom of the page. 
 
 ## Todo:
 
 * Add demographic data 
 * Extend geographic extent
 * Address search
 * Filter to open/available parcels 
 * Download data 
 * Sparklines and/or histograms to show distributions rather than means 
 
 ## Contributing
 If you would like to contribute to this project, feel free to contact me (Scott Farley, sfarley2@wisc.edu) or make a pull request. 
