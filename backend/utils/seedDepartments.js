import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../models/Department.js';
import User from '../models/User.js';

dotenv.config();

const departments = [
      { name: 'Electricity', slug: 'electricity', description: 'Power outages, billing, transformer faults', icon: 'Zap', color: 'from-yellow-400 to-amber-500', slaHours: { low: 72, medium: 48, high: 24, emergency: 2 } },
      { name: 'Water Supply', slug: 'water_supply', description: 'Water shortage, pipeline leaks, quality issues', icon: 'Droplets', color: 'from-cyan-400 to-blue-500', slaHours: { low: 72, medium: 48, high: 24, emergency: 4 } },
      { name: 'Roads & Transport', slug: 'roads_transport', description: 'Potholes, traffic signals, road damage', icon: 'Car', color: 'from-slate-500 to-gray-600', slaHours: { low: 96, medium: 72, high: 48, emergency: 12 } },
      { name: 'Sanitation', slug: 'sanitation', description: 'Garbage collection, drainage, cleanliness', icon: 'Trash2', color: 'from-emerald-400 to-green-500', slaHours: { low: 48, medium: 24, high: 12, emergency: 4 } },
      { name: 'Police', slug: 'police', description: 'Safety concerns, noise, law enforcement', icon: 'Shield', color: 'from-blue-600 to-indigo-600', slaHours: { low: 48, medium: 24, high: 6, emergency: 1 } },
      { name: 'Healthcare', slug: 'healthcare', description: 'Hospital services, ambulance, medical', icon: 'Heart', color: 'from-rose-400 to-red-500', slaHours: { low: 48, medium: 24, high: 8, emergency: 1 } },
      { name: 'Municipal Services', slug: 'municipal', description: 'Property tax, building permits, civic amenities', icon: 'Building2', color: 'from-violet-500 to-purple-600', slaHours: { low: 96, medium: 72, high: 48, emergency: 24 } },
      { name: 'Education', slug: 'education', description: 'School facilities, teacher issues, scholarships', icon: 'GraduationCap', color: 'from-orange-400 to-amber-500', slaHours: { low: 96, medium: 72, high: 48, emergency: 24 } },
];

const seedDB = async () => {
      try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB Atlas');

            // Seed departments
            for (const dept of departments) {
                  await Department.findOneAndUpdate(
                        { slug: dept.slug },
                        dept,
                        { upsert: true, new: true }
                  );
                  console.log(`  ✔ Department: ${dept.name}`);
            }

            // Create admin user if not exists
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                  console.log('  ℹ No super admin needed - use /api/admin/register for department admins');
            } else {
                  await User.updateMany(
                        { role: 'admin', $or: [{ adminLevel: { $exists: false } }, { adminLevel: null }] },
                        { $set: { adminLevel: 'super_admin', managedDepartment: '' } }
                  );
                  console.log('  ℹ Admin user already exists (super_admin ensured)');
            }

            console.log('\n🎉 Database seeded successfully!\n');
            process.exit(0);
      } catch (err) {
            console.error('❌ Seed error:', err.message);
            process.exit(1);
      }
};

seedDB();
