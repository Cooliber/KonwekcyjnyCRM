import { describe, it, expect } from 'vitest';
import {
  optimizeRoutes,
  generateRouteDirections,
  type RoutePoint,
  type TechnicianProfile,
} from '../lib/routeOptimization';

describe('Route Optimization', () => {
  const mockTechnicians: TechnicianProfile[] = [
    {
      id: 'tech-1',
      name: 'Jan Kowalski',
      homeLocation: { lat: 52.2297, lng: 21.0122 },
      serviceAreas: ['Śródmieście', 'Mokotów', 'Żoliborz'],
      workingHours: { start: '08:00', end: '17:00' },
      skills: ['installation', 'repair'],
      vehicleType: 'van',
    },
    {
      id: 'tech-2',
      name: 'Anna Nowak',
      homeLocation: { lat: 52.1700, lng: 21.1000 },
      serviceAreas: ['Wilanów', 'Ursynów', 'Mokotów'],
      workingHours: { start: '09:00', end: '18:00' },
      skills: ['maintenance', 'inspection'],
      vehicleType: 'car',
    },
  ];

  const mockJobs: RoutePoint[] = [
    {
      id: 'job-1',
      lat: 52.2297,
      lng: 21.0122,
      address: 'ul. Marszałkowska 1',
      district: 'Śródmieście',
      priority: 'urgent',
      estimatedDuration: 120,
      jobType: 'emergency',
    },
    {
      id: 'job-2',
      lat: 52.1850,
      lng: 21.0250,
      address: 'ul. Puławska 10',
      district: 'Mokotów',
      priority: 'high',
      estimatedDuration: 90,
      jobType: 'repair',
    },
    {
      id: 'job-3',
      lat: 52.1700,
      lng: 21.1000,
      address: 'ul. Wilanowska 5',
      district: 'Wilanów',
      priority: 'medium',
      estimatedDuration: 60,
      jobType: 'maintenance',
    },
    {
      id: 'job-4',
      lat: 52.2700,
      lng: 21.0000,
      address: 'ul. Słowackiego 15',
      district: 'Żoliborz',
      priority: 'low',
      estimatedDuration: 45,
      jobType: 'inspection',
    },
  ];

  describe('optimizeRoutes', () => {
    it('should assign jobs to appropriate technicians based on service areas', () => {
      const routes = optimizeRoutes(mockTechnicians, mockJobs);

      expect(routes).toHaveLength(2);
      
      // Tech-1 should get Śródmieście, Mokotów, and Żoliborz jobs
      const tech1Route = routes.find(r => r.technicianId === 'tech-1');
      expect(tech1Route).toBeDefined();
      expect(tech1Route!.points).toHaveLength(3);
      expect(tech1Route!.districtCoverage).toContain('Śródmieście');
      expect(tech1Route!.districtCoverage).toContain('Mokotów');
      expect(tech1Route!.districtCoverage).toContain('Żoliborz');

      // Tech-2 should get Wilanów job
      const tech2Route = routes.find(r => r.technicianId === 'tech-2');
      expect(tech2Route).toBeDefined();
      expect(tech2Route!.points).toHaveLength(1);
      expect(tech2Route!.districtCoverage).toContain('Wilanów');
    });

    it('should prioritize urgent jobs', () => {
      const routes = optimizeRoutes(mockTechnicians, mockJobs, {
        prioritizeUrgent: true,
      });

      const tech1Route = routes.find(r => r.technicianId === 'tech-1');
      expect(tech1Route).toBeDefined();
      
      // First job should be the urgent one
      expect(tech1Route!.points[0].priority).toBe('urgent');
    });

    it('should respect maximum jobs per technician', () => {
      const routes = optimizeRoutes(mockTechnicians, mockJobs, {
        maxJobsPerTechnician: 2,
      });

      routes.forEach(route => {
        expect(route.points.length).toBeLessThanOrEqual(2);
      });
    });

    it('should calculate route metrics correctly', () => {
      const routes = optimizeRoutes(mockTechnicians, mockJobs);

      routes.forEach(route => {
        expect(route.totalDistance).toBeGreaterThan(0);
        expect(route.totalDuration).toBeGreaterThan(0);
        expect(route.efficiency).toBeGreaterThanOrEqual(0);
        expect(route.efficiency).toBeLessThanOrEqual(1);
        expect(route.estimatedCost).toBeGreaterThan(0);
      });
    });

    it('should handle empty job list', () => {
      const routes = optimizeRoutes(mockTechnicians, []);

      expect(routes).toHaveLength(2);
      routes.forEach(route => {
        expect(route.points).toHaveLength(0);
        expect(route.totalDistance).toBe(0);
        expect(route.totalDuration).toBe(0);
        expect(route.efficiency).toBe(0);
      });
    });

    it('should handle technicians with no matching service areas', () => {
      const techWithNoAreas: TechnicianProfile = {
        id: 'tech-3',
        name: 'Test Tech',
        homeLocation: { lat: 52.0000, lng: 21.0000 },
        serviceAreas: ['NonExistentDistrict'],
        workingHours: { start: '08:00', end: '17:00' },
        skills: ['repair'],
        vehicleType: 'car',
      };

      const routes = optimizeRoutes([techWithNoAreas], mockJobs);

      expect(routes).toHaveLength(0);
    });

    it('should sort routes by efficiency', () => {
      const routes = optimizeRoutes(mockTechnicians, mockJobs);

      for (let i = 1; i < routes.length; i++) {
        expect(routes[i-1].efficiency).toBeGreaterThanOrEqual(routes[i].efficiency);
      }
    });
  });

  describe('generateRouteDirections', () => {
    it('should generate correct directions for a route', () => {
      const mockRoute = {
        technicianId: 'tech-1',
        points: [mockJobs[0], mockJobs[1]],
        totalDistance: 5.2,
        totalDuration: 180,
        efficiency: 0.85,
        districtCoverage: ['Śródmieście', 'Mokotów'],
        estimatedCost: 250,
      };

      const directions = generateRouteDirections(mockRoute);

      expect(directions).toContain('🏠 Start from home base');
      expect(directions).toContain('🏠 Return to home base');
      expect(directions.some(d => d.includes('🚨 EMERGENCY'))).toBe(true);
      expect(directions.some(d => d.includes('⚡ REPAIR'))).toBe(true);
      expect(directions.some(d => d.includes('5.2km'))).toBe(true);
      expect(directions.some(d => d.includes('250 PLN'))).toBe(true);
    });

    it('should handle empty route', () => {
      const emptyRoute = {
        technicianId: 'tech-1',
        points: [],
        totalDistance: 0,
        totalDuration: 0,
        efficiency: 0,
        districtCoverage: [],
        estimatedCost: 0,
      };

      const directions = generateRouteDirections(emptyRoute);

      expect(directions).toContain('No jobs assigned for this route.');
    });

    it('should include estimated duration for each job', () => {
      const mockRoute = {
        technicianId: 'tech-1',
        points: [mockJobs[0]],
        totalDistance: 2.5,
        totalDuration: 120,
        efficiency: 0.9,
        districtCoverage: ['Śródmieście'],
        estimatedCost: 150,
      };

      const directions = generateRouteDirections(mockRoute);

      expect(directions.some(d => d.includes('⏱️ Est. duration: 120 min'))).toBe(true);
    });
  });

  describe('Route Efficiency Calculation', () => {
    it('should calculate higher efficiency for shorter routes with more jobs', () => {
      // Create two scenarios: one with jobs close together, one spread out
      const closeJobs: RoutePoint[] = [
        {
          id: 'close-1',
          lat: 52.2297,
          lng: 21.0122,
          address: 'Address 1',
          district: 'Śródmieście',
          priority: 'medium',
          estimatedDuration: 60,
          jobType: 'maintenance',
        },
        {
          id: 'close-2',
          lat: 52.2300,
          lng: 21.0125,
          address: 'Address 2',
          district: 'Śródmieście',
          priority: 'medium',
          estimatedDuration: 60,
          jobType: 'maintenance',
        },
      ];

      const spreadJobs: RoutePoint[] = [
        {
          id: 'spread-1',
          lat: 52.2297,
          lng: 21.0122,
          address: 'Address 1',
          district: 'Śródmieście',
          priority: 'medium',
          estimatedDuration: 60,
          jobType: 'maintenance',
        },
        {
          id: 'spread-2',
          lat: 52.1700,
          lng: 21.1000,
          address: 'Address 2',
          district: 'Wilanów',
          priority: 'medium',
          estimatedDuration: 60,
          jobType: 'maintenance',
        },
      ];

      const closeRoutes = optimizeRoutes([mockTechnicians[0]], closeJobs);
      const spreadRoutes = optimizeRoutes([mockTechnicians[0]], spreadJobs);

      expect(closeRoutes[0].efficiency).toBeGreaterThan(spreadRoutes[0].efficiency);
    });

    it('should account for job priority in efficiency calculation', () => {
      const highPriorityJobs: RoutePoint[] = [
        {
          ...mockJobs[0],
          priority: 'urgent',
        },
        {
          ...mockJobs[1],
          priority: 'high',
        },
      ];

      const lowPriorityJobs: RoutePoint[] = [
        {
          ...mockJobs[0],
          priority: 'low',
        },
        {
          ...mockJobs[1],
          priority: 'low',
        },
      ];

      const highPriorityRoutes = optimizeRoutes([mockTechnicians[0]], highPriorityJobs);
      const lowPriorityRoutes = optimizeRoutes([mockTechnicians[0]], lowPriorityJobs);

      expect(highPriorityRoutes[0].efficiency).toBeGreaterThan(lowPriorityRoutes[0].efficiency);
    });
  });

  describe('Warsaw District Efficiency', () => {
    it('should apply correct district efficiency multipliers', () => {
      // Test that Śródmieście (heavy traffic) has lower efficiency than Wilanów
      const srodmiescieJob: RoutePoint = {
        id: 'srodmiescie',
        lat: 52.2297,
        lng: 21.0122,
        address: 'Śródmieście Address',
        district: 'Śródmieście',
        priority: 'medium',
        estimatedDuration: 60,
        jobType: 'maintenance',
      };

      const wilanowJob: RoutePoint = {
        id: 'wilanow',
        lat: 52.1700,
        lng: 21.1000,
        address: 'Wilanów Address',
        district: 'Wilanów',
        priority: 'medium',
        estimatedDuration: 60,
        jobType: 'maintenance',
      };

      const srodmiescieRoute = optimizeRoutes([mockTechnicians[0]], [srodmiescieJob]);
      const wilanowRoute = optimizeRoutes([mockTechnicians[1]], [wilanowJob]);

      // Wilanów should have better efficiency due to less traffic
      expect(wilanowRoute[0].efficiency).toBeGreaterThan(srodmiescieRoute[0].efficiency);
    });
  });
});
