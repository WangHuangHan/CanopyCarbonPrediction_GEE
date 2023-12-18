//************************************************************************** 
// Function to calculate Principal Components
// Code adapted from https://developers.google.com/earth-engine/guides/arrays_eigen_analysis
//************************************************************************** 
function PCA(maskedImage){
  var image = maskedImage.unmask()
  var scale = scale;
  var region = boundary;
  var bandNames = image.bandNames();
  // Mean center the data to enable a faster covariance reducer
  // and an SD stretch of the principal components.
  var meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: boundary,
    scale: scale,
    maxPixels: 1e13,
    tileScale: 16
  });
  var means = ee.Image.constant(meanDict.values(bandNames));
  var centered = image.subtract(means);
  // This helper function returns a list of new band names.
  var getNewBandNames = function(prefix) {
    var seq = ee.List.sequence(1, bandNames.length());
    return seq.map(function(b) {
      return ee.String(prefix).cat(ee.Number(b).int());
    });
  };
  // This function accepts mean centered imagery, a scale and
  // a region in which to perform the analysis.  It returns the
  // Principal Components (PC) in the region as a new image.
  var getPrincipalComponents = function(centered, scale, region) {
    // Collapse the bands of the image into a 1D array per pixel.
    var arrays = centered.toArray();
    
    // Compute the covariance of the bands within the region.
    var covar = arrays.reduceRegion({
      reducer: ee.Reducer.centeredCovariance(),
      geometry: region,
      scale: scale,
      maxPixels: 1e13,
      tileScale: 16
    });

    // Get the 'array' covariance result and cast to an array.
    // This represents the band-to-band covariance within the region.
    var covarArray = ee.Array(covar.get('array'));

    // Perform an eigen analysis and slice apart the values and vectors.
    var eigens = covarArray.eigen();

    // This is a P-length vector of Eigenvalues.
    var eigenValues = eigens.slice(1, 0, 1);
    
    // Compute Percentage Variance of each component
    // This will allow us to decide how many components capture
    // most of the variance in the input
    var eigenValuesList = eigenValues.toList().flatten()
    var total = eigenValuesList.reduce(ee.Reducer.sum())

    var percentageVariance = eigenValuesList.map(function(item) {
      var component = eigenValuesList.indexOf(item).add(1).format('%02d')
      var variance = ee.Number(item).divide(total).multiply(100).format('%.2f')
      return ee.List([component, variance])
    })
    // Create a dictionary that will be used to set properties on final image
    var varianceDict = ee.Dictionary(percentageVariance.flatten())
    // This is a PxP matrix with eigenvectors in rows.
    var eigenVectors = eigens.slice(1, 1);
    // Convert the array image to 2D arrays for matrix computations.
    var arrayImage = arrays.toArray(1);

    // Left multiply the image array by the matrix of eigenvectors.
    var principalComponents = ee.Image(eigenVectors).matrixMultiply(arrayImage);

    // Turn the square roots of the Eigenvalues into a P-band image.
    // Call abs() to turn negative eigenvalues to positive before
    // taking the square root
    var sdImage = ee.Image(eigenValues.abs().sqrt())
      .arrayProject([0]).arrayFlatten([getNewBandNames('sd')]);

    // Turn the PCs into a P-band image, normalized by SD.
    return principalComponents
      // Throw out an an unneeded dimension, [[]] -> [].
      .arrayProject([0])
      // Make the one band array image a multi-band image, [] -> image.
      .arrayFlatten([getNewBandNames('pc')])
      // Normalize the PCs by their SDs.
      .divide(sdImage)
      .set(varianceDict);
  };
  var pcImage = getPrincipalComponents(centered, scale, region);
  return pcImage.mask(maskedImage.mask());
}

///////////////////////////////////////////////////////////////////////////////////////////
// Merge the predictor variables
var mergedCollection = S2_composite
  .addBands(PRS_VV_iqr)
  .addBands(PRS_VH_iqr)
  .addBands(elevation)
  .addBands(slope)
  .addBands(forest_mask);


// Perform PCA on Sentinel-2 data
var pcaResult = PCA(mergedCollection, 30, boundary);
print("pcaResult: ", pcaResult);

var selectedPCABands = pcaResult.select(['pc1', 'pc2', 'pc3', 'pc4']); // Adjust the number of components as needed

// Clip to the output image to Uni Malaya study area boundary.
var clippedmergedCollection = pcaResult.clipToCollection(boundary_feature);
print('clippedmergedCollection: ', clippedmergedCollection);

// Bands to include in the classification
var bands = ['pc1', 'pc2', 'pc3', 'pc4'];
