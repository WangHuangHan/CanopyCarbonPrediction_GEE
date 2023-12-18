//**************************************************************************
// This AGBD sample snippet shows how to import the GEDI_L4B dataset.
// Also, it presents how to get the sampling points and do further random forest modeling.
//************************************************************************** 
// Prepare training dataset
var l4b = ee.Image('LARSE/GEDI/GEDI04_B_002');

var dataset = l4b.select('MU').clip(boundary);

// Reproject to MY zone
var dataset = dataset.reproject({crs: 'EPSG:32647', scale:30});

// Check projection information
print('Projection, crs, and crs_transform:', dataset.projection());

// Display the GEDI L4B dataset
Map.addLayer(dataset,
    {min: 10, max: 250, palette: '440154,414387,2a788e,23a884,7ad151,fde725'},
    'Mean Biomass');

// Sample the training points from the dataset
var points = dataset.sample({
  region: boundary,
  scale: 100,
  numPixels: 2000,
  seed: 11,
  geometries: true});
  
// Print and display the points derived from the GEDI L4B dataset
print('Size: ', points.size());
print(points.limit(10));

// Display the training points
Map.addLayer(points, {}, 'Sampling points');

// Split training data into training and testing sets
// Add a random column (named random) and specify seed value for repeatability.
var datawithColumn = points.randomColumn('random', 27);

// Use 70% for training, 30% for validation
var split = 0.7;
var trainingData = datawithColumn.filter(ee.Filter.lt('random', split));

// Print the training data
print('training data', trainingData);

var validationData = datawithColumn.filter(ee.Filter.gte('random', split));

// Print the testing (validation) data
print('validation data', validationData);

///////////////////////////////////////////////////////////////////////////////////////////
// Perform Random Forest Regression
// Collect training data
var training = clippedmergedCollection.select(bands).sampleRegions({
  collection: trainingData,
  properties: ['MU'],
  scale: 10 // Need to change the scale of training data to avoid the 'out of memory' problem
});

// Train a random forest classifier for regression
var classifier = ee.Classifier.smileRandomForest({numberOfTrees:25, seed:42}) // 50 trees
  .setOutputMode('REGRESSION')
  .train({
    features: training,
    classProperty: 'MU',
    inputProperties: bands
  });  