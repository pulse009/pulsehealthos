import Link from 'next/link';
import { Button, Card } from '@/components/ui/primitives';


export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md p-6 text-center">
        <h1 className="text-base font-semibold">Not found</h1>
        <p className="text-muted mt-2 text-sm">
          This page does not exist, or you do not have access to it.
        </p>
        <div className="mt-5 flex justify-center">
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
