'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Sparkles, UserCog } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
    <Compass className="h-7 w-7 text-accent" />
    <span className="font-headline text-2xl font-bold tracking-tight">
      Course Compass
    </span>
  </Link>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={cn("text-sm font-medium transition-colors hover:text-accent", isActive ? "text-accent" : "text-muted-foreground")}>
      {children}
    </Link>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        
        <div className="flex items-center gap-6 text-sm md:ml-6">
          <NavLink href="/">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Search Courses</span>
            </div>
          </NavLink>
          <NavLink href="/course-match">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Course Match</span>
            </div>
          </NavLink>
        </div>
        
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/login">
              <UserCog className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
