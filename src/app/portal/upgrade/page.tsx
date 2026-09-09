import { redirect } from 'next/navigation';

export default function UpgradeRedirectPage() {
  redirect('/portal/subscription');
}
