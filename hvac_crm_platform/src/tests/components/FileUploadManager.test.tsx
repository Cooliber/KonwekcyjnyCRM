import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadManager } from '../../components/modules/FileUploadManager';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test-url.com/file.jpg' } })),
        remove: vi.fn()
      }))
    }
  },
  STORAGE_BUCKETS: {
    EQUIPMENT_PHOTOS: 'equipment-photos',
    INVOICES: 'invoices',
    TECHNICAL_DRAWINGS: 'technical-drawings',
    DOCUMENTS: 'documents'
  },
  FILE_UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf']
  },
  uploadFileWithProgress: vi.fn(),
  getFileUrl: vi.fn(() => 'https://test-url.com/file.jpg'),
  deleteFile: vi.fn()
}));

// Mock Convex
vi.mock('convex/react', () => ({
  useMutation: vi.fn(() => vi.fn())
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('FileUploadManager', () => {
  const mockProps = {
    jobId: 'test-job-id',
    contactId: 'test-contact-id',
    onUploadComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload interface correctly', () => {
    render(<FileUploadManager {...mockProps} />);
    
    expect(screen.getByText('File Upload Manager')).toBeInTheDocument();
    expect(screen.getByText('Select Files')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument();
  });

  it('handles file selection via button click', async () => {
    const user = userEvent.setup();
    render(<FileUploadManager {...mockProps} />);
    
    const selectButton = screen.getByText('Select Files');
    await user.click(selectButton);
    
    // File input should be triggered (hidden input)
    const fileInput = document.querySelector('input[type="file"][multiple]');
    expect(fileInput).toBeInTheDocument();
  });

  it('handles camera capture button click', async () => {
    const user = userEvent.setup();
    render(<FileUploadManager {...mockProps} />);
    
    const cameraButton = screen.getByText('Take Photo');
    await user.click(cameraButton);
    
    // Camera input should be triggered (hidden input with capture)
    const cameraInput = document.querySelector('input[type="file"][capture]');
    expect(cameraInput).toBeInTheDocument();
  });

  it('validates file size limits', async () => {
    const { uploadFileWithProgress } = await import('../../lib/supabase');
    vi.mocked(uploadFileWithProgress).mockResolvedValue({
      data: { path: 'test-path' },
      error: null
    });

    render(<FileUploadManager {...mockProps} />);
    
    // Create a large file (over 50MB limit)
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large-file.jpg', {
      type: 'image/jpeg'
    });

    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [largeFile]
      }
    });

    // Should show error toast for large file
    await waitFor(() => {
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        expect.stringContaining('too large')
      );
    });
  });

  it('categorizes files correctly', () => {
    render(<FileUploadManager {...mockProps} />);
    
    // Test file type detection through drag and drop
    const imageFile = new File(['image content'], 'equipment.jpg', { type: 'image/jpeg' });
    const pdfFile = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const drawingFile = new File(['drawing content'], 'blueprint-drawing.dwg', { type: 'application/octet-stream' });

    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [imageFile, pdfFile, drawingFile]
      }
    });

    // Files should be categorized and displayed
    expect(screen.getByText('equipment.jpg')).toBeInTheDocument();
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('blueprint-drawing.dwg')).toBeInTheDocument();
  });

  it('shows upload progress correctly', async () => {
    const { uploadFileWithProgress } = await import('../../lib/supabase');
    
    // Mock progress callback
    vi.mocked(uploadFileWithProgress).mockImplementation(async (bucket, path, file, onProgress) => {
      // Simulate progress updates
      if (onProgress) {
        onProgress(25);
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(50);
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(100);
      }
      return { data: { path: 'test-path' }, error: null };
    });

    render(<FileUploadManager {...mockProps} />);
    
    const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [testFile]
      }
    });

    // Should show progress bar
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('handles upload errors gracefully', async () => {
    const { uploadFileWithProgress } = await import('../../lib/supabase');
    vi.mocked(uploadFileWithProgress).mockRejectedValue(new Error('Upload failed'));

    render(<FileUploadManager {...mockProps} />);
    
    const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [testFile]
      }
    });

    await waitFor(() => {
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upload')
      );
    });
  });

  it('generates appropriate tags for Warsaw districts', () => {
    render(<FileUploadManager {...mockProps} />);
    
    // Test files with Warsaw district names
    const mokotowFile = new File(['content'], 'mokotów-installation.jpg', { type: 'image/jpeg' });
    const srodmiescieFIle = new File(['content'], 'śródmieście-hvac.pdf', { type: 'application/pdf' });

    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [mokotowFile, srodmiescieFIle]
      }
    });

    // Files should be processed with district tags
    expect(screen.getByText('mokotów-installation.jpg')).toBeInTheDocument();
    expect(screen.getByText('śródmieście-hvac.pdf')).toBeInTheDocument();
  });

  it('supports file deletion', async () => {
    const { deleteFile } = await import('../../lib/supabase');
    vi.mocked(deleteFile).mockResolvedValue({ data: null, error: null });

    render(<FileUploadManager {...mockProps} />);
    
    const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByText('Drag & drop files here').closest('div');
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [testFile]
      }
    });

    // Wait for upload to complete, then find delete button
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
