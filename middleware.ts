import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabase = async (request: NextRequest) => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function middleware(request: NextRequest) {
  const supabase = await getSupabase(request)
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const publicPaths = ['/', '/auth', '/auth/callback', '/onboarding']
  const protectedPaths = ['/hotspots', '/trips', '/profile', '/activity', '/buddies']

  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  if (!session) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|/_next/data/.*).*)']
}
