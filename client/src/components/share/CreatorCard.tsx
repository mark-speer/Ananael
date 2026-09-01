export interface PublicCreator {
  _id: string;
  username: string;
  createdAt: string | Date;
  traditions?: string[];
  profileImageUrl?: string;
}

export interface CreatorCardProps {
  creator?: PublicCreator | null;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  if (!creator) return null;

  const createdDate = creator.createdAt
    ? new Date(creator.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-ananael-gold/30 bg-ananael-card/80 p-4 shadow-md backdrop-blur-sm">
      {creator.profileImageUrl ? (
        <img
          src={creator.profileImageUrl}
          alt={creator.username}
          className="h-12 w-12 rounded-full border border-ananael-gold/50 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ananael-gold/50 bg-ananael-gold/20 text-lg font-bold text-ananael-gold">
          {creator.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ananael-gold/70">
            Created by
          </span>
          <span className="font-display font-semibold text-ananael-gold">
            @{creator.username}
          </span>
        </div>
        {creator.traditions && creator.traditions.length > 0 && (
          <p className="mt-0.5 text-xs text-ananael-gold/60">
            {creator.traditions.join(' · ')}
          </p>
        )}
        {createdDate && (
          <p className="mt-0.5 text-xs text-ananael-gold/50">
            Shared on {createdDate}
          </p>
        )}
      </div>
    </div>
  );
}
