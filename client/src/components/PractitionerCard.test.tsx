import { render, screen } from '@testing-library/react';
import PractitionerCard from './PractitionerCard';

describe('PractitionerCard Component', () => {
  const mockPractitioner = {
    _id: 'user123',
    username: 'hermetic_seeker',
    traditions: ['Western Hermetic', 'Taoist'],
    createdAt: new Date('2024-01-15T00:00:00Z'),
  };

  describe('Display', () => {
    it('should render username', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={true}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('hermetic_seeker')).toBeInTheDocument();
    });

    it('should render traditions array', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/Western Hermetic/)).toBeInTheDocument();
      expect(screen.getByText(/Taoist/)).toBeInTheDocument();
    });

    it('should render join date', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/January 15, 2024|15 Jan 2024|2024/)).toBeInTheDocument();
    });

    it('should show online badge when online', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={true}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/online|Online|ONLINE/i)).toBeInTheDocument();
    });

    it('should not show online badge when offline', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.queryByText(/online|Online|ONLINE/i)).not.toBeInTheDocument();
    });

    it('should render avatar with first letter initial', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      // Avatar should show "H" for "hermetic_seeker"
      expect(screen.getByText(/H/)).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onClick handler when clicked', () => {
      const mockClick = jest.fn();

      const { container } = render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={mockClick}
        />
      );

      const card = container.querySelector('[data-testid="practitioner-card"]') || container.firstChild;
      if (card instanceof HTMLElement) {
        card.click();
      }

      expect(mockClick).toHaveBeenCalledWith(mockPractitioner);
    });

    it('should navigate to profile when linked', () => {
      render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      const link = screen.getByRole('link', { hidden: true }) || screen.getByText(/hermetic_seeker/);
      expect(link).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single tradition', () => {
      const practitioner = {
        ...mockPractitioner,
        traditions: ['Goetia'],
      };

      render(
        <PractitionerCard
          practitioner={practitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/Goetia/)).toBeInTheDocument();
    });

    it('should handle empty traditions array', () => {
      const practitioner = {
        ...mockPractitioner,
        traditions: [],
      };

      render(
        <PractitionerCard
          practitioner={practitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/hermetic_seeker/)).toBeInTheDocument();
    });

    it('should handle missing traditions field', () => {
      const practitioner: any = {
        _id: 'user123',
        username: 'hermetic_seeker',
        createdAt: new Date('2024-01-15T00:00:00Z'),
      };

      render(
        <PractitionerCard
          practitioner={practitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/hermetic_seeker/)).toBeInTheDocument();
    });

    it('should handle very long username', () => {
      const practitioner = {
        ...mockPractitioner,
        username: 'a'.repeat(40),
      };

      render(
        <PractitionerCard
          practitioner={practitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('a'.repeat(40))).toBeInTheDocument();
    });

    it('should handle many traditions', () => {
      const practitioner = {
        ...mockPractitioner,
        traditions: ['Goetia', 'Kabbalah', 'Taoist', 'Shamanism', 'Hermetic'],
      };

      render(
        <PractitionerCard
          practitioner={practitioner}
          isOnline={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText(/Goetia/)).toBeInTheDocument();
      expect(screen.getByText(/Hermetic/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply dark theme classes', () => {
      const { container } = render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={true}
          onClick={jest.fn()}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-slate-800');
    });

    it('should show online indicator with green color', () => {
      const { container } = render(
        <PractitionerCard
          practitioner={mockPractitioner}
          isOnline={true}
          onClick={jest.fn()}
        />
      );

      const onlineBadge = container.querySelector('.bg-green-500, [class*="green"]');
      expect(onlineBadge).toBeInTheDocument();
    });
  });
});
