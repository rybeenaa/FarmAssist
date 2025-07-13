// Mock API service to demonstrate loading states and toast notifications

export interface FarmData {
  id: string;
  name: string;
  email: string;
  cropType: string;
  area: number;
  location: string;
  registrationDate: string;
}

export interface CropInfo {
  id: string;
  name: string;
  plantingDate: string;
  harvestDate: string;
  status: 'planted' | 'growing' | 'ready' | 'harvested';
  yieldExpected: number;
}

// Simulate API delays for demonstration
const apiDelay = (ms: number = 1500) => new Promise(resolve => setTimeout(resolve, ms));

export const farmAPI = {
  // Fetch farm data
  async getFarmData(farmId: string): Promise<FarmData> {
    await apiDelay(2000);
    
    // Simulate occasional failures for demo
    if (Math.random() < 0.2) {
      throw new Error('Failed to fetch farm data from server');
    }

    return {
      id: farmId,
      name: 'Green Valley Farm',
      email: 'farmer@greenvalley.com',
      cropType: 'rice',
      area: 25.5,
      location: 'Punjab, India',
      registrationDate: new Date().toISOString(),
    };
  },

  // Submit farm registration
  async submitFarmData(farmData: Omit<FarmData, 'id' | 'registrationDate'>): Promise<FarmData> {
    await apiDelay(1800);
    
    // Simulate validation errors
    if (!farmData.name || !farmData.email || !farmData.cropType) {
      throw new Error('Missing required fields');
    }

    // Simulate server errors occasionally
    if (Math.random() < 0.15) {
      throw new Error('Server error: Unable to process registration');
    }

    return {
      ...farmData,
      id: `farm_${Date.now()}`,
      registrationDate: new Date().toISOString(),
    };
  },

  // Fetch crop information
  async getCropInfo(farmId: string): Promise<CropInfo[]> {
    await apiDelay(1200);
    
    if (Math.random() < 0.1) {
      throw new Error('Unable to load crop information');
    }

    return [
      {
        id: 'crop_1',
        name: 'Basmati Rice',
        plantingDate: '2024-06-15',
        harvestDate: '2024-11-15',
        status: 'growing',
        yieldExpected: 4.2,
      },
      {
        id: 'crop_2',
        name: 'Wheat',
        plantingDate: '2024-11-01',
        harvestDate: '2025-04-15',
        status: 'planted',
        yieldExpected: 3.8,
      },
    ];
  },

  // Update farm profile
  async updateFarmProfile(farmId: string, updates: Partial<FarmData>): Promise<FarmData> {
    await apiDelay(1000);
    
    if (Math.random() < 0.1) {
      throw new Error('Failed to update profile');
    }

    // Return updated farm data
    return {
      id: farmId,
      name: updates.name || 'Updated Farm',
      email: updates.email || 'updated@farm.com',
      cropType: updates.cropType || 'rice',
      area: updates.area || 20,
      location: updates.location || 'Unknown',
      registrationDate: '2024-01-01T00:00:00Z',
    };
  },

  // Delete farm data
  async deleteFarmData(farmId: string): Promise<void> {
    await apiDelay(800);
    
    if (Math.random() < 0.05) {
      throw new Error('Failed to delete farm data');
    }
    
    // Successful deletion (no return value)
  },

  // Search farms
  async searchFarms(query: string): Promise<FarmData[]> {
    await apiDelay(1500);
    
    if (Math.random() < 0.1) {
      throw new Error('Search service temporarily unavailable');
    }

    // Return mock search results
    return [
      {
        id: 'farm_search_1',
        name: `${query} Valley Farm`,
        email: `contact@${query.toLowerCase()}valley.com`,
        cropType: 'corn',
        area: 15.2,
        location: 'California, USA',
        registrationDate: '2024-01-15T00:00:00Z',
      },
    ];
  },
};
