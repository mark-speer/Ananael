import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { AuthContext } from '../context/AuthContext';

// Mock the API
global.fetch = jest.fn();

describe('ProfilePage Component', () => {
  const mockUser = {
    _id: 'user123',
    username: 'test_user',
    traditions: ['Goetia', 'Kabbalah'],
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Profile (Non-Owner)', () => {
    it('should display public profile data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('test_user')).toBeInTheDocument();
      });

      expect(screen.getByText(/Goetia/)).toBeInTheDocument();
      expect(screen.getByText(/Kabbalah/)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => mockUser }), 100)
          )
      );

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should display error message on 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'User not found' }),
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should display private profile message on 403', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'This profile is private' }),
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/private/i)).toBeInTheDocument();
      });
    });
  });

  describe('Owner View', () => {
    it('should show edit button for profile owner', async () => {
      const ownUser = { ...mockUser, _id: 'owner123' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ownUser,
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: { _id: 'owner123', username: 'test_user', email: 'test@example.com' },
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/edit/i)).toBeInTheDocument();
      });
    });

    it('should not show edit button for non-owner', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: { _id: 'other_user', username: 'other', email: 'other@example.com' },
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('test_user')).toBeInTheDocument();
      });

      expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();
    });
  });

  describe('Username in URL', () => {
    it('should fetch profile by username from URL param', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
      });

      // Note: In real test, router would set URL params
      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: null,
              login: jest.fn(),
              logout: jest.fn(),
              register: jest.fn(),
              loading: false,
              refetchUser: jest.fn(),
            }}
          >
            <ProfilePage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
