'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdviserMeetingsRedirect() {
	const router = useRouter();
	useEffect(() => {
		// Redirect legacy/new path to the existing meeting schedule page
		router.replace('/defenses');
	}, [router]);
	return null;
}
