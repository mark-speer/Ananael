import { useState } from 'react';
import AccountButton from './AccountButton';
import AccountModal from './AccountModal';

interface AccountMenuProps {
  className?: string;
}

/**
 * Account trigger + modal pair for sidebar footer and mobile header.
 */
export default function AccountMenu({ className }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AccountButton
        expanded={open}
        onClick={() => setOpen(true)}
        className={className}
      />
      <AccountModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
