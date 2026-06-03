export const mapGeoServerFeature = (feature) => ({
  id: feature?.id ?? null,
  geometry: feature?.geometry ?? null,
  properties: feature?.properties ?? {},
});

export const mapGeoServerFeatureCollection = (featureCollection) => {
  if (!featureCollection || !Array.isArray(featureCollection.features)) {
    return [];
  }

  return featureCollection.features.map(mapGeoServerFeature);
};
