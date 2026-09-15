import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - BetStudio',
  description: 'BetStudio Public API documentation for developers',
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
