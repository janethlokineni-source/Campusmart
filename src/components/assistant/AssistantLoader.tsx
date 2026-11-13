'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const ShoppingAssistantWidget = dynamic(
  () => import('@/components/assistant/ShoppingAssistantWidget'),
  { ssr: false }
);

const EXCLUDED_PREFIXES = ['/login', '/register', '/admin'];

export default function AssistantLoader() {
  const pathname = usePathname() || '/';
  const isExcluded = EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isExcluded) {
    return null;
  }

  return <ShoppingAssistantWidget />;
}

