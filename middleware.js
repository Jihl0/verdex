import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase"; // You'll need to set up Firebase Admin

export async function middleware(request) {
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    await auth.verifySessionCookie(session, true);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: ["/dashboard", "/seed-harvest", "/seed-distribute"],
};
