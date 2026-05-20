import Complaint from '../models/Complaint.js';

const DUPLICATE_RADIUS_KM = 0.5;
const DUPLICATE_WINDOW_DAYS = 30;
const DUPLICATE_BOOST_THRESHOLD = 2;

function toRad(deg) {
      return (deg * Math.PI) / 180;
}

/** Haversine distance in km */
export function distanceKm(lat1, lng1, lat2, lng2) {
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find similar complaints: same category + within ~500m in last 30 days.
 * If 2+ already exist at location, new complaint should get HIGH priority boost.
 */
export async function checkDuplicateCluster({ category, coordinates }) {
      if (!coordinates?.lat || !coordinates?.lng) {
            return {
                  duplicateCount: 0,
                  boostPriority: false,
                  reason: null,
                  nearbyIds: [],
            };
      }

      const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const candidates = await Complaint.find({
            category,
            status: { $nin: ['rejected', 'closed'] },
            'location.coordinates.lat': { $exists: true },
            'location.coordinates.lng': { $exists: true },
            createdAt: { $gte: since },
      })
            .select('complaintId title priority location.coordinates createdAt')
            .limit(200)
            .lean();

      const nearby = candidates.filter((c) => {
            const coords = c.location?.coordinates;
            if (!coords?.lat || !coords?.lng) return false;
            return (
                  distanceKm(coordinates.lat, coordinates.lng, coords.lat, coords.lng) <=
                  DUPLICATE_RADIUS_KM
            );
      });

      const duplicateCount = nearby.length;
      const boostPriority = duplicateCount >= DUPLICATE_BOOST_THRESHOLD;

      return {
            duplicateCount,
            boostPriority,
            nearbyIds: nearby.map((c) => c.complaintId),
            reason: boostPriority
                  ? `${duplicateCount + 1} citizens reported similar "${category}" issues within 500m — priority elevated`
                  : duplicateCount > 0
                    ? `${duplicateCount} similar report(s) nearby`
                    : null,
      };
}

const PRIORITY_RANK = { low: 0, medium: 1, high: 2, emergency: 3 };
const PRIORITY_BY_RANK = ['low', 'medium', 'high', 'emergency'];

export function mergePriorityWithDuplicate(aiPriority, duplicateResult, isEmergency) {
      let rank = PRIORITY_RANK[aiPriority] ?? 1;
      if (duplicateResult?.boostPriority) rank = Math.max(rank, PRIORITY_RANK.high);
      if (isEmergency) rank = PRIORITY_RANK.emergency;
      return PRIORITY_BY_RANK[rank];
}
