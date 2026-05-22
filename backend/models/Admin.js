import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  department: {
    type: String,
    required: true,
    enum: ['police', 'electricity', 'water_supply', 'roads_transport', 'healthcare', 'municipal', 'sanitation', 'education'],
    lowercase: true
  },
  password: { type: String, required: true, select: false },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
      name: this.name,
      department: this.department,
      managedDepartment: this.department,
      role: 'admin',
      adminLevel: 'department_admin',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
