import { authOptions } from '@/auth/config/auth';
import NextAuth from 'next-auth';

// next-auth@4 expects the classic handler export style.
// In Next.js 15+/16, we need to let NextAuth handle the routing internally.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
