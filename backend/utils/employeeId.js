import User from '../models/User.js';

const DEPT_PREFIX = {
      police: 'POL',
      electricity: 'ELE',
      water_supply: 'WAT',
      roads_transport: 'ROD',
      healthcare: 'HLT',
      municipal: 'MUN',
      sanitation: 'SAN',
      education: 'EDU',
};

export async function generateEmployeeId(departmentSlug) {
      const year = new Date().getFullYear();
      const prefix = DEPT_PREFIX[departmentSlug] || 'EMP';
      const pattern = new RegExp(`^${prefix}-${year}-`);
      const count = await User.countDocuments({
            role: 'officer',
            department: departmentSlug,
            employeeId: pattern,
      });
      return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
}
