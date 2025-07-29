import fs from 'fs';
import path from 'path';

// Test to ensure that each vendor playbook has a .gitkeep file in its runs directory

describe('playbook runs folder integrity', () => {
  const vendors = ['sunbelt', 'unitedrentals', 'farmington', 'mikesrentals', 'fabickrents'];
  vendors.forEach((vendor) => {
    test(`should contain .gitkeep for ${vendor}`, () => {
      // Resolve the path to the .gitkeep file relative to the repository root
      const filePath = path.resolve(__dirname, '../../..', 'playbooks', vendor, 'runs', '.gitkeep');
      const exists = fs.existsSync(filePath);
      expect(exists).toBe(true);
    });
  });
});
