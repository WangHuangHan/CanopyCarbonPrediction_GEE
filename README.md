# Canopy Height and Carbon Stock Prediction Using Satellite Images with Machine Learning on GEE
<img src="https://raw.githubusercontent.com/WangHuangHan/CanopyCarbonPrediction_GEE/main/Project_Images/1%20Title.png" width="666">

## Description
This project uses satellite imagery on [Google Earth Engine](https://earthengine.google.com/) (GEE) to predict canopy height and estimate carbon content in the University of Malaya (Kuala Lumpur, Malaysia) area.

## Setup and Installation
- **Prerequisites:** Obtain access to [Google Earth Engine Code Editor](https://code.earthengine.google.com/) and have a GEE account. If not, please register [here](https://code.earthengine.google.com/register).
- **Installation:** No installation required; access GEE platform and import necessary scripts.

## Usage
- Example snippets to execute canopy height prediction and carbon estimation using GEE's JavaScript.
- Instructions on how to run the scripts within the GEE platform.

## Data Sources
- [Sentinel-1 (C-band synthetic aperture radar SAR)](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD):
  Sentinel-1 is a space mission by the European Union (EU) and carried out by ESA under the Copernicus Program.
  - VV and VH bands capture signals reflected from the Earth's surface, including vegetation and terrain.
  - Use VV and VH as predictor variables. These bands offer radar backscatter values that can be related to vegetation structure, including canopy height, as validation with GEDI Data.

- [Sentinel-2](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR):
  Sentinel-2 is a European multi-spectral imaging mission with high resolution.
  - Included 12 spectral bands with resolutions of 10m, 20m, and 60m.
  - Primary objective: monitoring variability in land surface conditions.
  - Select bands 'B2’, 'B3’, 'B4’, 'B5’, 'B6’, 'B7’, 'B8’, 'B11’, 'B12’ as predictor variables. → Manual feature selection
  - Take all the 12 bands from ’B1’ to ‘B12’ as independent variables. → Automatic feature selection

- [NASA SRTM Digital Elevation 30m](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003):
  SRTM data is used to construct a global digital elevation model.
  - SRTM was conducted aboard the space shuttle Endeavour from February 11-22, 2000.
  - Extract ”Slope” and “Elevation” as predictor variables.
  
- [European Space Agency (ESA) WorldCover 10m](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v100):
  ESA dataset is lunched since there is a massive need for accurate, timely, and high-resolution information on land cover, land use, and earth surface change.
  - Use value 10 (Tree Cover only) as a predictor variable.
  
- [GEDI L2A Raster Canopy Top Height](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI02_A_002_MONTHLY):
  GEDI Light Detection and Ranging (Lidar) is an active remote sensing technology that uses a laser pulse to measure distance.
  - Primarily used for measuring tree height, aboveground biomass, as well as leaf area index.
  - Using 'rh98' (relative height metrics at 98%) to be the sampling point.
  
- [GEDI L4B Gridded Aboveground Biomass Density](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI04_B_002):
  This dataset encompasses gridded information on aboveground biomass density derived from GEDI observations. These data provide insights into vegetation growth and 
  distribution, offering valuable information for understanding global vegetation health and the impacts of climate change.
  - Using 'MU' (mean aboveground biomass density, which estimated mean AGBD for the 1 km grid cell, including forest and non-forest.) to be the sampling point.

## Project Model Structure
<img src="https://raw.githubusercontent.com/WangHuangHan/CanopyCarbonPrediction_GEE/main/Project_Images/2%20Model%20Structure.png" width="666">
This model represents an example of a canopy height prediction workflow. For the AGBD prediction modeling and PCA (Principal Component Analysis), I've organized them into separate folders for easy reference.

<img src="https://raw.githubusercontent.com/WangHuangHan/CanopyCarbonPrediction_GEE/main/Project_Images/3%20Study%20area.png" width="666">
The study area for this research project is located at the University of Malaya. Situated between Kuala Lumpur and Petaling Jaya (Selangor), the university's campus is surrounded by forested areas. Notably, within the campus lies Rimba Ilmu (The Forest of Knowledge), a designated reserved forests established in 1974 spanning approximately 80 hectares and boasting remarkable collections. Rimba Ilmu serves a crucial purpose, aiming to educate both the public and students about tropical plant life, ecology, and conservation, thereby raising awareness about these vital aspects.

## Minimal Reproducible Example (JavaScript Code)
### Section 1: Boundary Selection
```javascript
// Choose boundary on GEE
var boundary = ee.Geometry.Polygon(/* Coordinates */);

// Create a polygon feature
var polygon = ee.Feature(ee.Geometry.Polygon(boundary.coordinates()));

// Create a feature collection from the polygon
var boundary_feature = ee.FeatureCollection([polygon]);

// Print the feature collection
print('Boundary:', boundary_feature);
```
### Section 2: Importing Datasets (Sentinel-1, Sentinel-2, SRTM, ESA, GEDI)
```javascript
// Load Sentinel-1 for the non-rainy season.
var S1_PRS = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterDate('2021-04-01', '2021-06-30')
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filter(ee.Filter.bounds(boundary));


// Load Sentinel-2 spectral reflectance data.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR');

// Create a function to mask clouds using the Sentinel-2 QA band.
function maskS2clouds(image) {
  var qa = image.select('QA60');
  
  //Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = ee.Number(2).pow(10).int();
  var cirrusBitMask = ee.Number(2).pow(11).int();
  
  //Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  
  //Return the masked and scaled data.
  return image.updateMask(mask).divide(10000);
}

// Filter clouds from Sentinel-2 for a given period.
var composite = s2.filterDate('2021-04-01', '2021-06-30')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds)
                  .select('B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12');


// Load SRTM
var SRTM = ee.Image("USGS/SRTMGL1_003");
// Clip Elevation
var elevation = SRTM.clip(boundary);


// Load ESA World cover data
var dataset = ee.ImageCollection("ESA/WorldCover/v100").first();

// Clip the land cover to the boundary
var ESA_LC_2020 = dataset.clip(boundary);

// Extract forest areas from the land cover value = 10
var forest_mask = ESA_LC_2020.updateMask(
  ESA_LC_2020.eq(10) // Only keep pixels where class equals 2
);

// Display forests only
var visualization = {bands: ['Map'],};

Map.addLayer(forest_mask, visualization, "Trees");


// Import the "GEDI02_A_002_MONTHLY" dataset
var dataset = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY')
                  .map(qualityMask)
                  .select('rh98').filterBounds(boundary);
                  
// Create a palette to visaulize the dataset
var gediVis = {
  min: 1,
  max: 60,
  palette: 'darkred, red, orange, green, darkgreen', 
};

// Set the map center and visualize the dataset
Map.setCenter(101.6556468417507, 3.127386383953448, 13);
Map.addLayer(dataset, gediVis, 'rh98');
```
### Section 3:





