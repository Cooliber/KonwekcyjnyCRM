import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { MapModule } from '../components/modules/MapModule';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Polygon: ({ children }: any) => <div data-testid="polygon">{children}</div>,
  Polyline: ({ children }: any) => <div data-testid="polyline">{children}</div>,
}));

// Mock Convex queries
const mockConvexClient = new ConvexReactClient('https://test.convex.cloud');

const mockInstallations = [
  {
    _id: 'test-1',
    address: 'ul. Marszałkowska 1, Śródmieście',
    district: 'Śródmieście',
    status: 'active',
    coordinates: { lat: 52.2297, lng: 21.0122 },
    lastServiceDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    _id: 'test-2',
    address: 'ul. Wilanowska 5, Wilanów',
    district: 'Wilanów',
    status: 'needs_service',
    coordinates: { lat: 52.1700, lng: 21.1000 },
    lastServiceDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
];

const mockContacts = [
  {
    _id: 'contact-1',
    name: 'Jan Kowalski',
    address: 'ul. Marszałkowska 1, Śródmieście',
    district: 'Śródmieście',
    coordinates: { lat: 52.2297, lng: 21.0122 },
  },
];

// Mock useQuery hook
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useQuery: vi.fn((query, args) => {
      if (query.toString().includes('installations')) {
        return mockInstallations;
      }
      if (query.toString().includes('contacts')) {
        return mockContacts;
      }
      return [];
    }),
    useAction: vi.fn(() => vi.fn()),
  };
});

const renderWithConvex = (component: React.ReactElement) => {
  return render(
    <ConvexProvider client={mockConvexClient}>
      {component}
    </ConvexProvider>
  );
};

describe('MapModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map interface correctly', () => {
    renderWithConvex(<MapModule />);
    
    expect(screen.getByText('Interactive Warsaw HVAC Map')).toBeInTheDocument();
    expect(screen.getByText('AI-powered district analysis with route optimization')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('displays map view toggle buttons', () => {
    renderWithConvex(<MapModule />);
    
    expect(screen.getByText('Installations')).toBeInTheDocument();
    expect(screen.getByText('Affluence Map')).toBeInTheDocument();
    expect(screen.getByText('Route Planning')).toBeInTheDocument();
    expect(screen.getByText('🔮 Prophecy')).toBeInTheDocument();
  });

  it('switches between map views', async () => {
    renderWithConvex(<MapModule />);
    
    const affluenceButton = screen.getByText('Affluence Map');
    fireEvent.click(affluenceButton);
    
    // Should show district polygons in affluence view
    await waitFor(() => {
      expect(screen.getAllByTestId('polygon')).toHaveLength(8); // 8 districts
    });
  });

  it('displays installation markers', () => {
    renderWithConvex(<MapModule />);
    
    // Should render markers for installations with coordinates
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
  });

  it('shows district filter dropdown', () => {
    renderWithConvex(<MapModule />);
    
    const districtFilter = screen.getByDisplayValue('All Districts');
    expect(districtFilter).toBeInTheDocument();
    
    // Should include affluence percentages in options
    fireEvent.click(districtFilter);
    expect(screen.getByText(/Śródmieście.*90%/)).toBeInTheDocument();
  });

  it('displays route planning interface', async () => {
    renderWithConvex(<MapModule />);
    
    const routeButton = screen.getByText('Route Planning');
    fireEvent.click(routeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Planning Date:')).toBeInTheDocument();
      expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument();
    });
  });

  it('shows prophecy hotspots interface', async () => {
    renderWithConvex(<MapModule />);
    
    const prophecyButton = screen.getByText('🔮 Prophecy');
    fireEvent.click(prophecyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Prophecy of Data')).toBeInTheDocument();
      expect(screen.getByText('AI-powered service hotspot predictions')).toBeInTheDocument();
    });
  });

  it('handles district selection in affluence view', async () => {
    renderWithConvex(<MapModule />);
    
    // Switch to affluence view
    const affluenceButton = screen.getByText('Affluence Map');
    fireEvent.click(affluenceButton);
    
    // Mock district click (would normally be handled by Leaflet)
    // This tests the district insights panel display logic
    await waitFor(() => {
      expect(screen.getAllByTestId('polygon')).toHaveLength(8);
    });
  });

  it('validates Warsaw district data structure', () => {
    renderWithConvex(<MapModule />);
    
    // The component should have access to Warsaw districts data
    // This is tested indirectly through the filter dropdown
    const districtFilter = screen.getByDisplayValue('All Districts');
    fireEvent.click(districtFilter);
    
    // Should show major Warsaw districts
    expect(screen.getByText(/Śródmieście/)).toBeInTheDocument();
    expect(screen.getByText(/Wilanów/)).toBeInTheDocument();
    expect(screen.getByText(/Mokotów/)).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    // Mock empty data
    vi.mocked(require('convex/react').useQuery).mockReturnValue([]);
    
    renderWithConvex(<MapModule />);
    
    // Should still render the map interface
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByText('Interactive Warsaw HVAC Map')).toBeInTheDocument();
  });

  it('displays installation status correctly', () => {
    renderWithConvex(<MapModule />);
    
    // Should show status filter
    const statusFilter = screen.getByDisplayValue('All Statuses');
    expect(statusFilter).toBeInTheDocument();
    
    fireEvent.click(statusFilter);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Needs Service')).toBeInTheDocument();
    expect(screen.getByText('Warranty Expired')).toBeInTheDocument();
  });

  it('maintains responsive design', () => {
    renderWithConvex(<MapModule />);
    
    // Check for responsive grid classes
    const container = screen.getByTestId('map-container').parentElement;
    expect(container).toHaveClass('h-96');
    
    // Map view toggles should be responsive
    const toggleContainer = screen.getByText('Installations').parentElement;
    expect(toggleContainer).toHaveClass('flex', 'space-x-2');
  });
});
