import Officer from '../models/Officer.js';

const DEPT_PREFIX = {
  police: 'POL',
  electricity: 'ELE',
  water_supply: 'WAT',
  roads_transport: 'ROD',
  healthcare: 'HEA',
  municipal: 'MUN',
  sanitation: 'SAN',
  education: 'EDU',
};

/** Generate next employee ID for a department (e.g. POL-2026-001). */
export async function generateOfficerEmployeeId(departmentSlug) {
  const year = new Date().getFullYear();
  const prefix = DEPT_PREFIX[departmentSlug] || 'EMP';
  const pattern = new RegExp(`^${prefix}-${year}-`);
  const count = await Officer.countDocuments({
    department: departmentSlug,
    employeeId: pattern,
  });
  return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
}
