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
  There is a massive need for accurate, timely, and high-resolution information on land cover, land use, and earth surface change.
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


