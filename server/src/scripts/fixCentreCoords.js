import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: 'server/.env' });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const COORDS_MAP = {
  'RS Puram Dry Waste Collection Centre': { lat: 11.0086, lng: 76.9497 },
  'Saibaba Colony Plastic Recovery Unit': { lat: 11.0252, lng: 76.9421 },
  'Ukkadam Secondary Resource Recovery Centre': { lat: 10.9905, lng: 76.9614 },
  'Peelamedu E-Waste & Electronics SafeDrop': { lat: 11.0285, lng: 77.0028 },
  'Singanallur Special Recovery & Hazardous Facility': { lat: 10.9995, lng: 77.0267 },
  'Vellalore Integrated Solid Waste Management Facility': { lat: 10.9612, lng: 77.0124 }
};

async function fixCoordinates() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('recyclingcentres');
  
  const all = await col.find({}).toArray();
  let updatedCount = 0;
  for (const doc of all) {
    if (!doc.coordinates || typeof doc.coordinates.lat !== 'number' || typeof doc.coordinates.lng !== 'number') {
      const fallback = COORDS_MAP[doc.name] || { lat: 11.0168, lng: 76.9558 };
      await col.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            coordinates: fallback,
            location: {
              type: 'Point',
              coordinates: [fallback.lng, fallback.lat]
            }
          } 
        }
      );
      updatedCount++;
    } else if (!doc.location || !Array.isArray(doc.location.coordinates)) {
      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            location: {
              type: 'Point',
              coordinates: [doc.coordinates.lng, doc.coordinates.lat]
            }
          }
        }
      );
      updatedCount++;
    }
  }

  console.log(`✅ Fixed coordinates & location GeoJSON for ${updatedCount} recycling centres!`);
  await mongoose.disconnect();
}

fixCoordinates().catch(console.error);
