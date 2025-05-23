import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfileForm from './UserProfileForm';
import userService from '../../services/userService'; // To be mocked
import { User } from '../../types';

// Mock userService
jest.mock('../../services/userService');
const mockUpdateUserProfile = userService.updateUserProfile as jest.Mock;

const mockCurrentUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  bio: 'This is a test bio.',
  created_at: new Date().toISOString(),
};

describe('UserProfileForm', () => {
  let mockOnProfileUpdated: jest.Mock;

  beforeEach(() => {
    mockOnProfileUpdated = jest.fn();
    mockUpdateUserProfile.mockReset();
  });

  it('renders with current user data', () => {
    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    expect(screen.getByLabelText(/username/i)).toHaveValue(mockCurrentUser.username);
    expect(screen.getByLabelText(/bio/i)).toHaveValue(mockCurrentUser.bio);
    expect(screen.getByLabelText(/new password/i)).toHaveValue('');
  });

  it('allows typing in fields', () => {
    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newusername' } });
    expect(screen.getByLabelText(/username/i)).toHaveValue('newusername');

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpassword123' } });
    expect(screen.getByLabelText(/new password/i)).toHaveValue('newpassword123');

    fireEvent.change(screen.getByLabelText(/bio/i), { target: { value: 'Updated bio.' } });
    expect(screen.getByLabelText(/bio/i)).toHaveValue('Updated bio.');
  });

  it('calls updateUserProfile with changed data on submit', async () => {
    const updatedUserData: User = { ...mockCurrentUser, username: 'updateduser' };
    mockUpdateUserProfile.mockResolvedValueOnce(updatedUserData);

    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'updateduser' } });
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ username: 'updateduser' });
    });
    expect(mockOnProfileUpdated).toHaveBeenCalledWith(updatedUserData);
    expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
  });

  it('calls updateUserProfile with only password if only password changed', async () => {
    const updatedUserData: User = { ...mockCurrentUser }; // Password change doesn't alter current user object directly in this mock
    mockUpdateUserProfile.mockResolvedValueOnce(updatedUserData);

    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ password: 'newpass' });
    });
    expect(mockOnProfileUpdated).toHaveBeenCalledWith(updatedUserData);
  });

  it('shows error message on API failure', async () => {
    mockUpdateUserProfile.mockRejectedValueOnce(new Error('Update failed'));

    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'anotheruser' } });
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
    expect(mockOnProfileUpdated).not.toHaveBeenCalled();
  });

  it('does not call API if no data changed', () => {
    render(<UserProfileForm currentUser={mockCurrentUser} onProfileUpdated={mockOnProfileUpdated} />);
    
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    expect(screen.getByText(/no changes to save/i)).toBeInTheDocument();
  });
});
