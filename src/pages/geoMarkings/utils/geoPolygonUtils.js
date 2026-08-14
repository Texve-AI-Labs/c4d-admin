const isValidPoint = (point) =>
  point && typeof point.lat === 'number' && typeof point.lng === 'number';

const normalizePolygon = (polygon) =>
  Array.isArray(polygon) ? polygon.filter(isValidPoint) : [];

const getBounds = (polygon) => {
  const points = normalizePolygon(polygon);
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  points.forEach((point) => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  });

  return { minLat, maxLat, minLng, maxLng };
};

const boundsOverlap = (a, b) =>
  a.minLat <= b.maxLat &&
  a.maxLat >= b.minLat &&
  a.minLng <= b.maxLng &&
  a.maxLng >= b.minLng;

const orientation = (p, q, r) => {
  const value =
    (q.lng - p.lng) * (r.lat - q.lat) -
    (q.lat - p.lat) * (r.lng - q.lng);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : 2;
};

const onSegment = (p, q, r) =>
  q.lng <= Math.max(p.lng, r.lng) &&
  q.lng >= Math.min(p.lng, r.lng) &&
  q.lat <= Math.max(p.lat, r.lat) &&
  q.lat >= Math.min(p.lat, r.lat);

const segmentsIntersect = (p1, q1, p2, q2) => {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
};

const pointInPolygon = (point, polygon) => {
  const points = normalizePolygon(polygon);
  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng;
    const yi = points[i].lat;
    const xj = points[j].lng;
    const yj = points[j].lat;

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng <
        ((xj - xi) * (point.lat - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

export const polygonsOverlap = (polygonA, polygonB) => {
  const a = normalizePolygon(polygonA);
  const b = normalizePolygon(polygonB);

  if (a.length < 3 || b.length < 3) return false;

  const boundsA = getBounds(a);
  const boundsB = getBounds(b);
  if (!boundsA || !boundsB || !boundsOverlap(boundsA, boundsB)) return false;

  for (let i = 0; i < a.length; i += 1) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j += 1) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }

  if (pointInPolygon(a[0], b)) return true;
  if (pointInPolygon(b[0], a)) return true;
  return false;
};

export const normalizePolygonPoints = normalizePolygon;