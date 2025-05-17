this.addEventListener('message', (event) => {
  const { points, bounds, maxMarkers } = event.data;

  const visiblePoints = points.filter((point) => {
    return (
      point.latitude_site >= bounds[0] &&
      point.longitude_site >= bounds[1] &&
      point.latitude_site <= bounds[2] &&
      point.longitude_site <= bounds[3]
    );
  }).slice(0, maxMarkers);

  this.postMessage(visiblePoints);
});