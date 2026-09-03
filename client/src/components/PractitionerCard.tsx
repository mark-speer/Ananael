interface PublicUser {
  _id: string;
  username: string;
  createdAt: string;
  traditions?: string[];
  profileImageUrl?: string;
}

interface PractitionerCardProps {
  user: PublicUser;
  onClick?: () => void;
}

export default function PractitionerCard({ user, onClick }: PractitionerCardProps) {
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  return (
    <div
      onClick={onClick}
      className={`flex flex-col rounded-lg border border-ananael-border bg-ananael-panel/40 p-4 transition ${
        onClick ? 'cursor-pointer hover:border-ananael-gold/40 hover:bg-ananael-panel/60' : ''
      }`}
    >
      {/* Avatar & Username */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ananael-gold/20 to-ananael-gold/5 font-display text-sm font-bold text-ananael-gold">
          {user.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-ananael-gold">
            @{user.username}
          </h3>
          <p className="text-xs text-ananael-text/50">joined {joinDate}</p>
        </div>
      </div>

      {/* Traditions */}
      {user.traditions && user.traditions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-ananael-gold/60">
            Practices
          </p>
          <div className="flex flex-wrap gap-1">
            {user.traditions.slice(0, 3).map((tradition) => (
              <span
                key={tradition}
                className="rounded bg-ananael-gold/5 px-2 py-1 text-xs text-ananael-gold/70"
              >
                {tradition}
              </span>
            ))}
            {user.traditions.length > 3 && (
              <span className="text-xs text-ananael-text/50">
                +{user.traditions.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
